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
from django.db import transaction
from django.db.models.deletion import ProtectedError
from .utils import offer_slot_to_waitlist, _is_blackout
from .reservation_transactions import reservation_transaction

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

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "No se puede eliminar el paciente porque tiene reservas asociadas. Su historial debe conservarse."},
                status=status.HTTP_409_CONFLICT,
            )


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

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "No se puede eliminar la plantilla porque sus turnos tienen reservas asociadas. Podés desactivarla para conservar el historial."},
                status=status.HTTP_409_CONFLICT,
            )


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

    @reservation_transaction()
    def patch(self, request, pk):
        reservation = get_object_or_404(
            Reservation,
            id=pk,
            slot__template__business=request.user.business_profile
        )
        locked_slot = get_object_or_404(
            ResourceSlot.objects.select_for_update(of=("self",)),
            pk=reservation.slot_id,
        )
        reservation = get_object_or_404(
            Reservation.objects.select_for_update(of=("self",)),
            pk=pk,
            slot__template__business=request.user.business_profile,
        )
        reservation.slot = locked_slot

        if reservation.status == "cancelled":
            return Response(
                {"detail": "Esta reserva ya está cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.status = "cancelled"
        reservation.save(update_fields=["status"])

        transaction.on_commit(
            lambda: offer_slot_to_waitlist(locked_slot),
            robust=True,
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

    @reservation_transaction()
    def get(self, request, token):
        reservation = get_object_or_404(Reservation, confirmation_token=token)
        locked_slot = get_object_or_404(
            ResourceSlot.objects.select_for_update(of=("self",)),
            pk=reservation.slot_id,
        )
        reservation = get_object_or_404(
            Reservation.objects.select_for_update(of=("self",)),
            confirmation_token=token,
        )
        reservation.slot = locked_slot

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

            transaction.on_commit(
                lambda: offer_slot_to_waitlist(locked_slot),
                robust=True,
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

    def get(self, request, waitlist_id):
        cliente_lista = get_object_or_404(WaitlistEntry, id=waitlist_id)

        if cliente_lista.status != "offered" or not cliente_lista.offered_slot:
            return Response({"detail": "No tienes una oferta de turno activa"}, status=status.HTTP_400_BAD_REQUEST)

        if (
            cliente_lista.offer_expires_at is None
            or cliente_lista.offer_expires_at <= timezone.now()
        ):
            return Response({"detail": "El tiempo de confirmación expiró"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "id": cliente_lista.id,
            "first_name": cliente_lista.first_name,
            "last_name": cliente_lista.last_name,
            "email": cliente_lista.email,
            "offer_expires_at": cliente_lista.offer_expires_at,
            "slot": {
                "id": cliente_lista.offered_slot.id,
                "start_datetime": cliente_lista.offered_slot.start_datetime,
                "end_datetime": cliente_lista.offered_slot.end_datetime,
                "date": cliente_lista.offered_slot.date,
            },
            "business": {
                "id": cliente_lista.business.id,
                "full_name": cliente_lista.business.full_name,
                "specialty": cliente_lista.business.specialty,
                "specialty_display": cliente_lista.business.get_specialty_display(),
            }
        })

    @reservation_transaction()
    def post(self, request, waitlist_id):
        oferta_inicial = get_object_or_404(
            WaitlistEntry,
            id=waitlist_id,
        )

        if not oferta_inicial.offered_slot_id:
            return Response(
                {"detail": "No tenés una oferta de turno activa."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        locked_slot = get_object_or_404(
            ResourceSlot.objects.select_for_update(of=("self",)),
            pk=oferta_inicial.offered_slot_id,
        )

        cliente_lista = get_object_or_404(
            WaitlistEntry.objects.select_for_update(of=("self",)),
            id=waitlist_id,
        )

        if cliente_lista.offered_slot_id != locked_slot.pk:
            return Response(
                {"detail": "La oferta cambió. Volvé a consultar el turno."},
                status=status.HTTP_409_CONFLICT,
            )

        cliente_lista.offered_slot = locked_slot

        if cliente_lista.status != "offered" or not cliente_lista.offered_slot:
            return Response({"detail": "No tienes una oferta de turno activa"}, status=status.HTTP_400_BAD_REQUEST)

        if (
            cliente_lista.offer_expires_at is None
            or cliente_lista.offer_expires_at <= timezone.now()
        ):
            cliente_lista.status = "expired"
            cliente_lista.save(update_fields=["status"])
            return Response({"detail": "El tiempo de confirmación expiró"}, status=status.HTTP_400_BAD_REQUEST)

        if _is_blackout(
            cliente_lista.business,
            cliente_lista.offered_slot.date,
        ):
            return Response(
                {"detail": "El profesional no tiene disponibilidad para esta fecha."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            locked_slot.template.business_id != cliente_lista.business_id
            or not locked_slot.active
            or locked_slot.start_datetime <= timezone.now()
        ):
            return Response(
                {"detail": "El turno ofrecido ya no está disponible."},
                status=status.HTTP_409_CONFLICT,
            )

        tiene_reserva = Reservation.objects.filter(
            slot=locked_slot,
            status="confirmed",
        ).exists()

        tiene_otra_oferta = (
            WaitlistEntry.objects
            .filter(
                offered_slot=locked_slot,
                status="offered",
                offer_expires_at__gt=timezone.now(),
            )
            .exclude(pk=cliente_lista.pk)
            .exists()
        )

        if tiene_reserva or tiene_otra_oferta:
            return Response(
                {"detail": "El turno ya está reservado u ofrecido a otra persona."},
                status=status.HTTP_409_CONFLICT,
            )

        #si pasa los filtros, geteamos o creamos al paciente y lo agendamos
        nuevo_paciente, created = Patient.objects.get_or_create(email=cliente_lista.email, business=cliente_lista.business, defaults={
        'first_name': cliente_lista.first_name,
        'last_name': cliente_lista.last_name,
        'phone': cliente_lista.phone
        })

        nuevo_paciente = (
            Patient.objects
            .select_for_update(of=("self",))
            .get(pk=nuevo_paciente.pk)
        )

        reservas_antiguas = Reservation.objects.filter(
            slot__template__business=cliente_lista.business,
            patient=nuevo_paciente,
            status="confirmed",
            slot__start_datetime__gt=timezone.now(),
        ).order_by("slot_id", "id")

        for reserva_antigua in reservas_antiguas:
            reserva_antigua.status = "cancelled"
            reserva_antigua.save(update_fields=["status"])
            # Ofrecemos el turno liberado cuando el reclamo se confirme.
            transaction.on_commit(
                lambda slot=reserva_antigua.slot: offer_slot_to_waitlist(slot),
                robust=True,
            )

        Reservation.objects.create(
            reservation_firstname=nuevo_paciente.first_name,
            reservation_lastname=nuevo_paciente.last_name,
            reservation_phone=nuevo_paciente.phone,
            slot=locked_slot,
            patient=nuevo_paciente,
            status="confirmed",
        )
        cliente_lista.status = "booked"
        cliente_lista.save(update_fields=["status"])

        return Response({"detail": "Reserva agendada exitosamente!"})
