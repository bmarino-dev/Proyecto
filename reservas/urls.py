from django.urls import path
from . import views

urlpatterns = [
    # ==========================================
    # 1. AUTHENTICATION & SESSION
    # ==========================================
    path("auth/signup/", views.SignupCreateView.as_view(), name="signup"),

    # ==========================================
    # 2. B2B PRIVATE API (Requieren JWT)
    # ==========================================
    # Pacientes
    path("patients/", views.PatientListCreateView.as_view(), name="patient-list"),
    path("patients/<uuid:pk>/", views.PatientDetailView.as_view(), name="patient-detail"),

    # Templates de Disponibilidad
    path("templates/", views.ResourceTemplateListCreateView.as_view(), name="template-list"),
    path("templates/<uuid:pk>/", views.ResourceTemplateDetailView.as_view(), name="template-detail"),

    # Fechas Bloqueadas
    path("blackouts/", views.BlackOutDateListCreateView.as_view(), name="blackout-list"),
    path("blackouts/<uuid:pk>/", views.BlackOutDateDetailView.as_view(), name="blackout-detail"),

    # Reservas B2B
    path("reservations/", views.ReservationListCreateView.as_view(), name="reservation-list"),
    path("reservations/<uuid:pk>/cancel/", views.ReservationCancelView.as_view(), name="reservation-cancel"),

    # BusinessDetail
    path("business/me/", views.BusinessDetailView.as_view(), name="business-detail"),
    
    
    # ==========================================
    # 3. B2C PUBLIC API (No requieren Auth)
    # ==========================================
    # Perfil público del Profesional
    path("public/business/<uuid:pk>/", views.BusinessPublicRetrieveView.as_view(), name="public-business-detail"),
    
    # Slots disponibles
    path("public/slots/", views.AvailableSlotPublicListView.as_view(), name="public-slot-list"),
    
    # Reservar turno
    path("public/reservations/", views.ReservationPublicCreateView.as_view(), name="public-reservation-create"),

    # Confirmación/Cancelación pública por email token
    path("confirm/<uuid:token>/", views.ReservationConfirmView.as_view(), name="reservation-confirm"),
]
