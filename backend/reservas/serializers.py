from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Business, Patient, ResourceTemplate, ResourceSlot, Reservation, BlackOutDates, WaitlistEntry
from .utils import generate_slots_for_template
import re
from django.core.mail import send_mail


User = get_user_model()
PHONE_REGEX = re.compile(r'^\+?\d{8,15}$')


# ==========================================
# 1. AUTHENTICATION & PROFILES
# ==========================================

class SignupSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    specialty = serializers.ChoiceField(
        choices=["psychology", "nutrition", "physiotherapy", "other"],
        write_only=True,
        required=False,
        default="other"
    )

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "password", "phone", "specialty")

    def validate_phone(self, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError("Formato de teléfono inválido.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")
        specialty = validated_data.pop("specialty", "other")
        validated_data["role"] = "business"

        with transaction.atomic():
            user = User.objects.create(**validated_data)
            user.set_password(password)
            user.save()
            Business.objects.create(user=user, phone=phone, specialty=specialty)
        return user


class BusinessPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ("id", "full_name", "specialty", "phone")
        read_only_fields = fields


class BusinessDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ("id", "full_name", "specialty", "phone")
        read_only_fields = ("id", "full_name")


class BusinessPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)


# ==========================================
# 2. CORE ENTITIES (B2B)
# ==========================================

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            "id", "first_name", "last_name", "email",
            "phone", "notes", "last_visit", "created_at"
        )
        read_only_fields = ("id", "last_visit", "created_at")

    def validate_email(self, value):
        # Verificamos que el email sea único dentro del mismo profesional
        request = self.context.get("request")
        business = request.user.business_profile
        qs = Patient.objects.filter(business=business, email=value)
        # Si estamos actualizando, excluimos la instancia actual
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya tenés un paciente registrado con este email.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        business = request.user.business_profile
        return Patient.objects.create(business=business, **validated_data)


class ResourceTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceTemplate
        fields = ("id", "business", "name", "duration", "start_time", "end_time", "weekday", "start_date", "active")
        read_only_fields = ("id", "business")

    def validate(self, data):
        if data.get('end_time') and data.get('start_time') and data['end_time'] < data['start_time']:
            raise serializers.ValidationError({"end_time": "La hora de fin no puede ser anterior a la de inicio."})
        return data

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data['business'] = request.user.business_profile
        instance = super().create(validated_data)
        
        # Generar slots inmediatamente al crear la plantilla
        generate_slots_for_template(instance)
        
        return instance

    def update(self, instance, validated_data):
        # 1. Campos que definen el horario y calendario de la plantilla
        schedule_fields = (
            "weekday",
            "start_time",
            "end_time",
            "duration",
            "start_date",
        )
        
        # 2. Verificar si alguno de los campos de horario fue modificado
        schedule_changed = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in schedule_fields
        )

        # 3. Operación atómica para asegurar la consistencia de los datos
        with transaction.atomic():
            # 4. Si el horario cambió, desactivar slots futuros no comprometidos
            if schedule_changed:
                future_slots = instance.slots.filter(
                    start_datetime__gt=timezone.now(),
                )

                for slot in future_slots:
                    # Se protegen los turnos con reservas confirmadas u ofertas activas
                    if not slot.has_commitment:
                        ResourceSlot.objects.filter(pk=slot.pk).update(
                            active=False,
                        )

            # 5. Actualizar los datos de la plantilla
            instance = super().update(instance, validated_data)
        
            # 6. Si la plantilla está activa, regeneramos/actualizamos slots según la nueva configuración
            if instance.active:
                generate_slots_for_template(instance)
            
        return instance


class BlackOutDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlackOutDates
        fields = ("id", "start_date", "end_date", "reason")

    def validate(self, data):
        if data.get('end_date') and data.get('start_date') and data['end_date'] < data['start_date']:
            raise serializers.ValidationError({"end_date": "La fecha de fin no puede ser anterior a la de inicio."})
        return data

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data['business'] = request.user.business_profile
        return super().create(validated_data)



# ==========================================
# 3. SLOTS & RESERVATIONS
# ==========================================

class ResourceSlotSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = ResourceSlot
        fields = ("id", "date", "start_datetime", "end_datetime", "is_available")
        read_only_fields = fields


class ReservationCreateSerializer(serializers.ModelSerializer):
    """
    Usado por el profesional para crear una reserva manualmente.
    """
    slot_id = serializers.UUIDField(write_only=True)
    patient_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Reservation
        fields = ("id", "slot_id", "patient_id", "notes", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate(self, data):
        request = self.context.get("request")
        business = request.user.business_profile

        # Verificar que el slot exista y pertenezca al profesional
        try:
            slot = ResourceSlot.objects.get(
                id=data["slot_id"],
                template__business=business
            )
        except ResourceSlot.DoesNotExist:
            raise serializers.ValidationError({"slot_id": "El slot no existe o no te pertenece."})

        # Verificar que el slot esté disponible
        if not slot.is_available:
            raise serializers.ValidationError({"slot_id": "Este slot ya está reservado."})

        # Verificar que el paciente exista y pertenezca al profesional
        try:
            patient = Patient.objects.get(id=data["patient_id"], business=business)
        except Patient.DoesNotExist:
            raise serializers.ValidationError({"patient_id": "El paciente no existe."})

        data["slot"] = slot
        data["patient"] = patient
        return data

    def create(self, validated_data):
        patient = validated_data['patient']
        # Tomamos los datos actuales del paciente para el snapshot
        validated_data['reservation_firstname'] = patient.first_name
        validated_data['reservation_lastname'] = patient.last_name
        validated_data['reservation_phone'] = patient.phone
        return super().create(validated_data)



class ReservationDetailSerializer(serializers.ModelSerializer):
    """
    Usado para listar reservas con detalle del paciente y slot.
    """
    patient = PatientSerializer(read_only=True)
    slot = ResourceSlotSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = (
            "id", "slot", "patient", "status",
            "reservation_firstname", "reservation_lastname", "reservation_phone",
            "reminder_count", "last_reminder_sent_at", 
            "notes", "created_at"
        )
        read_only_fields = fields


class ReservationPublicSerializer(serializers.ModelSerializer):  

    slot_id = serializers.UUIDField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Reservation
        fields = ("id", "slot_id", "first_name", "last_name", "email", "phone", "notes", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate(self, data):
        try:
            slot = ResourceSlot.objects.get(id=data["slot_id"])
        except ResourceSlot.DoesNotExist:
            raise serializers.ValidationError({"slot_id": "El slot no existe."})

        if not slot.is_available:
            raise serializers.ValidationError({"slot_id": "Este slot ya está reservado o no está disponible."})
        
        if slot.start_datetime < timezone.now():
            raise serializers.ValidationError({"slot_id": "No se puede reservar un slot en el pasado."})
        data["slot"] = slot
        return data

    def create(self, validated_data):
        slot = validated_data.pop("slot")

        #utilizamos transaction.atomic para asegurar que la reserva se cree correctamente
        #y evitar condiciones de carrera
        with transaction.atomic():
            locked_slot = ResourceSlot.objects.select_for_update().get(id=slot.id)

            if not locked_slot.is_available:
                raise serializers.ValidationError({"slot_id" : "¡Este turno acaba de ser reservado por otro cliente!"})
            

            business = locked_slot.template.business

            #Extraer datos del paciente
            first_name = validated_data.pop("first_name")
            last_name = validated_data.pop("last_name")
            email = validated_data.pop("email")
            phone = validated_data.pop("phone", None)

            #Crear o encontrar al paciente
            patient, created = Patient.objects.get_or_create(
                business=business,
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone": phone
                }
            )
            # Actualizamos los datos si el paciente ya existía
            if not created:
                if not patient.first_name:
                    patient.first_name = first_name
                if not patient.last_name:
                    patient.last_name = last_name
                if phone and not patient.phone :
                    patient.phone = phone
                patient.save()
            
            reservation = Reservation.objects.create(reservation_firstname=first_name,  reservation_lastname=last_name, reservation_phone=phone, slot=slot, patient=patient, status="confirmed", **validated_data)

            #Generar URL de confirmación
            confirm_url = f"http://localhost:8001/confirm/{reservation.confirmation_token}/"

            #Crear mensaje de confirmación
            mensaje = f"""
            Hola {patient.first_name},
            
            ¡Tu turno ha sido confirmado con éxito! Si por alguna razón no puedes asistir, por favor cancela tu turno haciendo clic en este único enlace:
            {confirm_url}?cancel=1
            """
            #Enviar email de confirmación
            send_mail(
                "Confirmar reserva",
                mensaje,
                "[EMAIL_ADDRESS]",
                [email],
                fail_silently=False,
            )
            
            return reservation

class WaitlistCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistEntry
        fields = ("id", "first_name", "last_name", "email", "phone")
        read_only_fields = ("id",)
