from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Business, Patient, ResourceTemplate, ResourceSlot, Reservation, BlackOutDates
import re
from django.core.mail import send_mail

User = get_user_model()
PHONE_REGEX = re.compile(r'^\+?\d{8,15}$')


# AUTH

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



# PACIENTES

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


# SLOTS

class ResourceSlotSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = ResourceSlot
        fields = ("id", "date", "start_datetime", "end_datetime", "is_available")
        read_only_fields = fields


# BLACKOUT DATES

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


# RESERVAS

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
        validated_data.pop("slot_id")
        validated_data.pop("patient_id")
        return Reservation.objects.create(**validated_data)


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
            "confirmed_at", "reminder_count",
            "last_reminder_sent_at", "notes", "created_at"
        )
        read_only_fields = fields
    

#Reservations Publicas

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

            if not created:
                # Actualizamos los datos si el paciente ya existía
                patient.first_name = first_name
                patient.last_name = last_name
                if phone:
                    patient.phone = phone
                patient.save()
            
            reservation = Reservation.objects.create(slot =slot, patient = patient, **validated_data)

            #Generar URL de confirmación
            confirm_url = f"http://localhost:8000/confirm/{reservation.confirmation_token}/"

            #Crear mensaje de confirmación
            mensaje = f"""
            Hola {patient.first_name},
            
            Has solicitado un turno con nuestro equipo.
            Para confirmar tu cita definitivamente, haz clic en el siguiente enlace:
            {confirm_url}
            
            Si deseas cancelarlo, ingresa aquí: {confirm_url}?cancel=1
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

       
#Crear Template
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
        return super().create(validated_data)
    
    