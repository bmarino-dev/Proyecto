from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Patient, ResourceSlot, Reservation, BlackOutDates, ResourceTemplate, Business, WaitlistEntry
from .serializers import (
    SignupSerializer,
    BusinessPublicSerializer,
    PatientSerializer,
    ResourceTemplateSerializer,
    BlackOutDateSerializer,
    ResourceSlotSerializer,
    ReservationCreateSerializer,
    ReservationDetailSerializer,
    ReservationPublicSerializer,
    BusinessDetailSerializer,
    PasswordResetConfirmSerializer,
    BusinessPasswordResetSerializer,
    WaitlistCreateSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_decode
from datetime import timedelta

User = get_user_model()


# ==========================================
# 1. AUTHENTICATION & PROFILES
# ==========================================

class SignupCreateView(generics.CreateAPIView):
    """
    POST /auth/signup/
    Registra un nuevo profesional.
    """
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

class BusinessPublicRetrieveView(generics.RetrieveAPIView):
    """
    GET /public/business/:id/
    Perfil público del profesional.
    """
    serializer_class = BusinessPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Business.objects.filter(user__is_active=True)

class BusinessDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BusinessDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_object_or_404(Business, id=self.request.user.business_profile.id)

class BusinessPasswordResetView(generics.GenericAPIView):
    serializer_class = BusinessPasswordResetSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        #buscamos el usuario y mandamos el mail
        try:
            user = User.objects.get(email=email)
            
            #transformamos el id en string seguro para url
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            #creamos el token para enviarlo al mail y asegurarnos que lo abre el dueño del mail
            token = default_token_generator.make_token(user)

            reset_url = f"http://localhost:3000/reset-password/{uidb64}/{token}/"
            
            mensaje = f"""
            Hola {user.first_name},
            Has solicitado restablecer tu contraseña.
            Haz clic en el siguiente enlace para crear una nueva:
            {reset_url}
            """
            
            send_mail(
                "Restablecer contraseña",
                mensaje,
                "soporte@miapp.com",
                [email],
                fail_silently=False,
            )
            
        except User.DoesNotExist:
            pass

        #en cualquier caso devolvemos success para no dar pistas
        return Response({"detail": "Si el usuario existe, se le envio un mail con las instrucciones para restablecer la contraseña"})

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            uid = urlsafe_base64_decode(uid).decode()
            
            user = User.objects.get(pk=uid)
            if not default_token_generator.check_token(user, token):
                return Response({"detail": "Token inválido o expirado."},
            status=400)
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Contraseña restablecida correctamente."})
        except User.DoesNotExist:
            return Response({"detail": "Usuario no encontrado."}, status=400)


# ==========================================
# 2. B2B PRIVATE API (Profesionales)
# ==========================================

class PatientListCreateView(generics.ListCreateAPIView):
    """
    GET  /patients/       → Lista todos los pacientes del profesional
    POST /patients/       → Crea un nuevo paciente
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(business=self.request.user.business_profile)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /patients/:id/  → Detalle de un paciente
    PATCH  /patients/:id/  → Actualizar datos del paciente
    DELETE /patients/:id/  → Eliminar paciente
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(business=self.request.user.business_profile)


class ResourceTemplateListCreateView(generics.ListCreateAPIView):
    """
    GET  /templates/       → Lista todas las plantillas del profesional
    POST /templates/       → Crea una nueva plantilla
    """
    serializer_class = ResourceTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResourceTemplate.objects.filter(business=self.request.user.business_profile)


class ResourceTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /templates/:id/  → Detalle
    PATCH  /templates/:id/  → Actualizar/Desactivar
    DELETE /templates/:id/  → Borrar plantilla
    """
    serializer_class = ResourceTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResourceTemplate.objects.filter(business=self.request.user.business_profile)


class BlackOutDateListCreateView(generics.ListCreateAPIView):
    """
    GET  /blackouts/       → Lista todas las fechas bloqueadas
    POST /blackouts/       → Crea una nueva fecha bloqueada
    """
    serializer_class = BlackOutDateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BlackOutDates.objects.filter(business=self.request.user.business_profile)


class BlackOutDateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /blackouts/:id/  → Detalle
    PATCH  /blackouts/:id/  → Actualizar
    DELETE /blackouts/:id/  → Borrar
    """
    serializer_class = BlackOutDateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BlackOutDates.objects.filter(business=self.request.user.business_profile)


class ReservationListCreateView(generics.ListCreateAPIView):
    """
    GET  /reservations/   → Lista todas las reservas del profesional
    POST /reservations/   → Crea una nueva reserva
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReservationCreateSerializer
        return ReservationDetailSerializer

    def get_queryset(self):
        return Reservation.objects.filter(
            slot__template__business=self.request.user.business_profile
        ).select_related("slot", "patient")


class ReservationCancelView(APIView):
    """
    PATCH /reservations/:id/cancel/
    El profesional cancela una reserva desde el panel.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        reservation = get_object_or_404(
            Reservation,
            id=pk,
            slot__template__business=request.user.business_profile
        )

        if reservation.status == "cancelled":
            return Response(
                {"detail": "Esta reserva ya está cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.status = "cancelled"
        reservation.save(update_fields=["status"])

        slot_liberado = reservation.slot
        primer_esperando = WaitlistEntry.objects.filter(
                business=slot_liberado.template.business, 
                status = "waiting"
            ).order_by("created_at").first()

            
        if primer_esperando:
            #hacemos oferta temporal
            primer_esperando.offered_slot = slot_liberado
            primer_esperando.offer_expires_at = timezone.now() + timedelta(hours=2)
            primer_esperando.status = "offered"
            primer_esperando.save()

            #le mandamos el mail
            link_oferta = f"http://localhost:3000/waitlist/claim/{primer_esperando.id}/"
            mensaje_espera = f"""
                Hola {primer_esperando.first_name},
                ¡Se ha liberado un turno para ti!
                Fecha: {slot_liberado.start_datetime.strftime('%d/%m/%Y %H:%M')}
                Tienes 2 horas para reclamarlo haciendo clic aquí: {link_oferta}
                """
            send_mail(
                    "¡Turno Disponible! Lista de Espera",
                    mensaje_espera,
                    "soporte@miapp.com",
                    [primer_esperando.email],
                    fail_silently=False,
                    )
        return Response({"detail": "Reserva cancelada correctamente."})


        
        



# ==========================================
# 3. B2C PUBLIC API (Pacientes / Público)
# ==========================================


class AvailableSlotPublicListView(generics.ListAPIView):
    """
    GET /public/slots/?business=<business_id>&date=2026-06-01
    Lista pública de slots disponibles para un profesional en específico.
    No requiere autenticación.
    """
    serializer_class = ResourceSlotSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        business_id = self.request.query_params.get("business_id")
        if not business_id:
            return ResourceSlot.objects.none()

        qs = ResourceSlot.objects.filter(
            template__business_id=business_id,
            start_datetime__gte=timezone.now(),
            active=True,
        ).select_related("template").prefetch_related("reservation", "waitlistentry_set")

        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)

        # Solo devolvemos los disponibles
        available_ids = [slot.id for slot in qs if slot.is_available]
        return ResourceSlot.objects.filter(id__in=available_ids)


class ReservationPublicCreateView(generics.CreateAPIView):
    serializer_class = ReservationPublicSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class ReservationConfirmView(APIView):
    """
    GET /confirm/:token/?cancel=1 → Cancela el turno
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        reservation = get_object_or_404(Reservation, confirmation_token=token)

        if reservation.status == "cancelled":
            return Response(
                {"detail": "Este turno ya fue cancelado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reservation.slot.start_datetime < timezone.now():
            return Response(
                {"detail": "Este turno ya caducó."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancel = request.query_params.get("cancel")

        if cancel:
            reservation.status = "cancelled"
            reservation.save(update_fields=["status"])

            slot_liberado = reservation.slot
            primer_esperando = WaitlistEntry.objects.filter(
                business=slot_liberado.template.business, 
                status = "waiting"
            ).order_by("created_at").first()

            
            if primer_esperando:
                #hacemos oferta temporal
                primer_esperando.offered_slot = slot_liberado
                primer_esperando.offer_expires_at = timezone.now() + timedelta(hours=2)
                primer_esperando.status = "offered"
                primer_esperando.save()

                #le mandamos el mail
                link_oferta = f"http://localhost:3000/waitlist/claim/{primer_esperando.id}/"
                mensaje_espera = f"""
                    Hola {primer_esperando.first_name},
                    ¡Se ha liberado un turno para ti!
                    Fecha: {slot_liberado.start_datetime.strftime('%d/%m/%Y %H:%M')}
                    Tienes 2 horas para reclamarlo haciendo clic aquí: {link_oferta}
                    """
                send_mail(
                        "¡Turno Disponible! Lista de Espera",
                        mensaje_espera,
                        "soporte@miapp.com",
                        [primer_esperando.email],
                        fail_silently=False,
                    )
                
            return Response({"detail": "Turno cancelado exitosamente. Gracias por avisar."})


        return Response({"detail": "Tu turno ya se encuentra confirmado. Si deseas cancelar, utiliza el enlace de cancelación de tu correo."})

class WaitlistCreateView(generics.CreateAPIView):
    serializer_class = WaitlistCreateSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        business_id = self.kwargs.get("business_id")
        business = get_object_or_404(Business, id=business_id)

        serializer.save(business=business)

class WaitlistClaimView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, waitlist_id):
        
        cliente_lista = get_object_or_404(WaitlistEntry, id=waitlist_id)
        #si no fue ofertado, error
        if cliente_lista.status != "offered" or not cliente_lista.offered_slot:
            return Response({"detail": "No tienes una oferta de turno activa"}, status=status.HTTP_400_BAD_REQUEST)
        #si ya expiró
        if timezone.now() > cliente_lista.offer_expires_at:
            cliente_lista.status = "expired"
            cliente_lista.save()
            return Response({"detail": "El tiempo de confirmación expiró"}, status=status.HTTP_400_BAD_REQUEST)
        
        #si pasa los filtros, geteamos o creamos al paciente y lo agendamos
        nuevo_paciente, created = Patient.objects.get_or_create(email=cliente_lista.email, business=cliente_lista.business, defaults={
        'first_name': cliente_lista.first_name,
        'last_name': cliente_lista.last_name,
        'phone': cliente_lista.phone
        })
        #creamos la reserva
        Reservation.objects.create(slot=cliente_lista.offered_slot,patient=nuevo_paciente, status="confirmed")

        cliente_lista.status = "booked"
        cliente_lista.save()

        return Response({"detail": "Reserva agendada exitosamente!"})
