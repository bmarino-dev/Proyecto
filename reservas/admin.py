from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Business, Patient, BlackOutDates, ResourceTemplate, ResourceSlot, Reservation
from .utils import generate_slots_for_template


# ─────────────────────────────────────────
# USUARIO
# ─────────────────────────────────────────

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Agregamos el campo role a la vista del admin
    fieldsets = UserAdmin.fieldsets + (
        ("Rol", {"fields": ("role",)}),
    )
    list_display = ["username", "email", "first_name", "last_name", "role", "is_active"]
    list_filter = ["role", "is_active"]


# ─────────────────────────────────────────
# PROFESIONAL
# ─────────────────────────────────────────

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "specialty", "phone", "created_at"]
    list_filter = ["specialty"]
    search_fields = ["user__first_name", "user__last_name", "user__email"]


# ─────────────────────────────────────────
# PACIENTES
# ─────────────────────────────────────────

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "phone", "business", "last_visit", "created_at"]
    list_filter = ["business"]
    search_fields = ["first_name", "last_name", "email"]


# ─────────────────────────────────────────
# FECHAS BLOQUEADAS
# ─────────────────────────────────────────

@admin.register(BlackOutDates)
class BlackOutDatesAdmin(admin.ModelAdmin):
    list_display = ["business", "start_date", "end_date", "reason"]
    list_filter = ["business"]


# ─────────────────────────────────────────
# PLANTILLA DE SLOTS
# ─────────────────────────────────────────

@admin.register(ResourceTemplate)
class ResourceTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "business", "weekday", "start_time", "end_time", "duration", "active"]
    list_filter = ["business", "weekday", "active"]
    search_fields = ["name", "business__user__first_name", "business__user__last_name"]
    actions = ["generate_slots_action"]

    @admin.action(description="Generar slots para los templates seleccionados")
    def generate_slots_action(self, request, queryset):
        total = 0
        for template in queryset:
            created = generate_slots_for_template(template)
            total += created
        self.message_user(request, f"Se generaron {total} slots en total.")


# ─────────────────────────────────────────
# SLOTS
# ─────────────────────────────────────────

@admin.register(ResourceSlot)
class ResourceSlotAdmin(admin.ModelAdmin):
    list_display = ["template", "date", "start_datetime", "end_datetime", "active"]
    list_filter = ["template__business", "active", "date"]
    search_fields = ["template__name"]


# ─────────────────────────────────────────
# RESERVAS
# ─────────────────────────────────────────

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ["patient", "slot", "status", "confirmed_at", "reminder_count", "created_at"]
    list_filter = ["status", "slot__template__business"]
    search_fields = ["patient__first_name", "patient__last_name", "patient__email"]
    readonly_fields = ["confirmation_token", "confirmed_at", "reminder_count", "last_reminder_sent_at"]
