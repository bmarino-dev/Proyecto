from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("auth/signup/", views.SignupCreateView.as_view(), name="signup"),

    # Pacientes
    path("patients/", views.PatientListCreateView.as_view(), name="patient-list"),
    path("patients/<uuid:pk>/", views.PatientDetailView.as_view(), name="patient-detail"),

    # Templates de Disponibilidad
    path("templates/", views.ResourceTemplateListCreateView.as_view(), name="template-list"),
    path("templates/<uuid:pk>/", views.ResourceTemplateDetailView.as_view(), name="template-detail"),

    # Fechas Bloqueadas
    path("blackouts/", views.BlackOutDateListCreateView.as_view(), name="blackout-list"),
    path("blackouts/<uuid:pk>/", views.BlackOutDateDetailView.as_view(), name="blackout-detail"),

    # Slots disponibles
    path("public/slots/", views.AvailableSlotPublicListView.as_view(), name="public-slot-list"),

    # Reservas
    path("reservations/", views.ReservationListCreateView.as_view(), name="reservation-list"),
    path("reservations/<uuid:pk>/cancel/", views.ReservationCancelView.as_view(), name="reservation-cancel"),
    path("public/reservations/", views.ReservationPublicCreateView.as_view(), name="public-reservation-create"),

    # Confirmación pública por token (sin login)
    # Confirmar: GET /confirm/<token>/
    # Cancelar:  GET /confirm/<token>/?cancel=1
    path("confirm/<uuid:token>/", views.ReservationConfirmView.as_view(), name="reservation-confirm"),
]
