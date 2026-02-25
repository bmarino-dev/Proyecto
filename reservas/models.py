from django.db import models, transaction
import uuid
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


# ─────────────────────────────────────────
# USUARIOS
# ─────────────────────────────────────────

class User(AbstractUser):
    ROLE_CHOICES = (
        ("customer", "Cliente"),
        ("business", "Negocio"),
        ("staff", "Staff"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="business")


# ─────────────────────────────────────────
# PERFIL DEL PROFESIONAL (antes Business)
# Representa un psicólogo, nutricionista, fisioterapeuta, etc.
# ─────────────────────────────────────────

SPECIALTY_CHOICES = [
    ("psychology", "Psicología"),
    ("nutrition", "Nutrición"),
    ("physiotherapy", "Fisioterapia"),
    ("other", "Otro"),
]

class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_profile"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^\+?\d{8,15}$', message="Número de teléfono inválido")]
    )
    specialty = models.CharField(
        max_length=30,
        choices=SPECIALTY_CHOICES,
        default="other"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

    @property
    def email(self):
        return self.user.email

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()


# ─────────────────────────────────────────
# PACIENTE
# Contacto registrado por el profesional.
# No tiene login propio.
# ─────────────────────────────────────────

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="patients"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^\+?\d{8,15}$', message="Número de teléfono inválido")]
    )
    notes = models.TextField(blank=True)
    # Se actualiza automáticamente cada vez que se confirma una reserva
    last_visit = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        # Un profesional no puede tener dos pacientes con el mismo email
        unique_together = ("business", "email")
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


# ─────────────────────────────────────────
# FECHAS BLOQUEADAS
# ─────────────────────────────────────────

class BlackOutDates(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="blackout_dates"
    )
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    reason = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["business", "start_date"]
        verbose_name = "Blackout date"
        verbose_name_plural = "Blackout dates"

    def __str__(self):
        if self.end_date and self.end_date != self.start_date:
            return f"{self.business}: {self.start_date} → {self.end_date}"
        return f"{self.business}: {self.start_date}"

    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError("La fecha de fin no puede ser anterior a la de inicio.")


# ─────────────────────────────────────────
# PLANTILLA DE SLOTS
# Define los horarios recurrentes del profesional
# ej: Lunes de 9:00 a 12:00 con slots de 50 minutos
# ─────────────────────────────────────────

WEEKDAY_CHOICES = [
    (0, "Lunes"),
    (1, "Martes"),
    (2, "Miércoles"),
    (3, "Jueves"),
    (4, "Viernes"),
    (5, "Sábado"),
    (6, "Domingo"),
]

class ResourceTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="resource_template"
    )
    name = models.CharField(max_length=150)
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField(help_text="Hora de inicio (ej: 09:00)")
    end_time = models.TimeField(help_text="Hora de fin (ej: 12:00)")
    duration = models.DurationField(help_text="Duración de cada turno (ej: 00:50:00)")
    active = models.BooleanField(default=True)
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Desde qué fecha generar slots (inclusive)"
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["business", "weekday", "start_time"]

    def __str__(self):
        return f"{self.business} - {self.name} {self.get_weekday_display()} {self.start_time}"


# ─────────────────────────────────────────
# SLOT CONCRETO
# Una hora específica en una fecha específica
# ─────────────────────────────────────────

class ResourceSlot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        ResourceTemplate,
        on_delete=models.CASCADE,
        related_name="slots"
    )
    date = models.DateField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        unique_together = ("template", "date", "start_datetime")
        indexes = [
            models.Index(fields=["template", "date"]),
            models.Index(fields=["start_datetime"]),
        ]
        ordering = ["start_datetime"]

    def clean(self):
        if self.end_datetime <= self.start_datetime:
            raise ValidationError("end_datetime debe ser posterior a start_datetime.")

    def save(self, *args, **kwargs):
        if self.template and self.start_datetime:
            self.end_datetime = self.start_datetime + self.template.duration
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.template.business} - {self.template.name} - {self.start_datetime.isoformat()}"

    @property
    def is_available(self):
        # El slot está disponible si está activo y no tiene reserva o la reserva fue cancelada
        if not self.active:
            return False
        try:
            return self.reservation.status == "cancelled"
        except Reservation.DoesNotExist:
            return True


# ─────────────────────────────────────────
# RESERVA
# Vincula un slot con un paciente.
# Incluye el flujo de confirmación por email.
# ─────────────────────────────────────────

class Reservation(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pendiente"),
        ("confirmed", "Confirmado"),
        ("cancelled", "Cancelado"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slot = models.OneToOneField(
        ResourceSlot,
        on_delete=models.CASCADE,
        related_name="reservation"
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="reservations"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Token único que va en el link del email del paciente
    # El paciente confirma o cancela sin necesidad de login
    confirmation_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )

    # Se llena cuando el paciente hace clic en confirmar
    confirmed_at = models.DateTimeField(null=True, blank=True)

    # Cuántos recordatorios se mandaron (máximo 2: 48hs y 24hs antes)
    reminder_count = models.PositiveSmallIntegerField(default=0)

    # Fecha en que se mandó el último recordatorio
    last_reminder_sent_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["slot__start_datetime"]

    def __str__(self):
        return f"{self.patient} - {self.slot.start_datetime.isoformat()} ({self.status})"

    def clean(self):
        if self.slot.start_datetime < timezone.now():
            raise ValidationError("No se puede reservar un slot en el pasado.")

    def save(self, *args, **kwargs):
        with transaction.atomic():
            self.full_clean()
            super().save(*args, **kwargs)
            # Cuando se confirma, actualizamos last_visit del paciente
            if self.status == "confirmed":
                Patient.objects.filter(pk=self.patient_id).update(
                    last_visit=self.slot.date
                )