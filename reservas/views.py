from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Patient, ResourceSlot, Reservation, BlackOutDates
from .serializers import (
    SignupSerializer,
    PatientSerializer,
    ResourceSlotSerializer,
    ReservationCreateSerializer,
    ReservationDetailSerializer,
    BlackOutDateSerializer,
)


# AUTH

class SignupCreateView(generics.CreateAPIView):
    """
    POST /auth/signup/
    Registra un nuevo profesional.
    """
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


# PACIENTES

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



# SLOTS DISPONIBLES

class AvailableSlotListView(generics.ListAPIView):
    """
    GET /slots/?date=2024-06-01   → Slots disponibles del profesional para una fecha
    GET /slots/                   → Todos los slots futuros disponibles
    """
    serializer_class = ResourceSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.business_profile
        qs = ResourceSlot.objects.filter(
            template__business=business,
            start_datetime__gte=timezone.now(),
            active=True,
        ).select_related("template", "reservation")

        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)

        # Solo devolvemos los disponibles
        available_ids = [slot.id for slot in qs if slot.is_available]
        return ResourceSlot.objects.filter(id__in=available_ids)


# BLACKOUT DATES (Fechas Bloqueadas)

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


# RESERVAS

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
        return Response({"detail": "Reserva cancelada correctamente."})


# CONFIRMACIÓN PÚBLICA POR TOKEN
# El paciente accede a este endpoint desde el link del email.
# No requiere login.

class ReservationConfirmView(APIView):
    """
    GET /confirm/:token/          → Confirma el turno
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
                {"detail": "Este turno ya pasó."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancel = request.query_params.get("cancel")

        if cancel:
            reservation.status = "cancelled"
            reservation.save(update_fields=["status"])
            return Response({"detail": "Turno cancelado. Esperamos verte pronto."})

        reservation.status = "confirmed"
        reservation.confirmed_at = timezone.now()
        reservation.save(update_fields=["status", "confirmed_at"])
        return Response({"detail": "Turno confirmado. ¡Nos vemos!"})