from django.db import models, transaction
import uuid
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError




#clase que hereda de User original
class User(AbstractUser):
    ROLE_CHOICES = (("customer", "Cliente"), ("business", "Negocio"), ("staff", "Staff"))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="business")

#cliente OneToOne con User
class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    phone = models.CharField(max_length=50, blank=True, validators= [RegexValidator(r'^\+?\d{8,15}$', message="Debe ser un número de teléfono válido")])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.user.username
    
    @property
    def email(self):
        return self.user.email
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
#Perfil de negocios (OneToOne con User)    
class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_profile")
    phone = models.CharField(max_length=20, blank=True, validators=[RegexValidator(r'^\+?\d{8,15}$', message="Debe ser un número de teléfono válido")])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.user.username
    
    @property
    def email(self):
        return self.user.email
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()    


class BlackOutDates(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="blackout_dates")
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    reason = models.CharField(max_length=30, blank=True, null=True)
    
    class Meta:
        ordering = ["business", "start_date"]
        verbose_name = "Blackout date"
        verbose_name_plural = "Blackout dates"
        
    #POSIBLE CORRECCION EN __STR__
    def __str__(self):
        if self.end_date and self.end_date != self.start_date:
            return f"{self.business.__str__}: {self.start_date} → {self.end_date}"
        return f"{self.business.__str__}: {self.start_date}"
    
    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError("La fecha de fin no puede ser anterior a la de inicio.")
    
    
    
WEEKDAY_CHOICES = [
    (0, "Lunes"),
    (1, "Martes"),
    (2, "Miércoles"),
    (3, "Jueves"),
    (4, "Viernes"),
    (5, "Sábado"),
    (6, "Domingo"),
]    
    
#Reserva especifica, ej: lunes de 9:00 a 10:00  
class ResourceTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="resource_template")
    name = models.CharField(max_length=150)
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField(help_text="Hora de inicio (ej: 09:00)")
    duration = models.DurationField(help_text="Duración del slot (ej: 00:30:00)")
    active = models.BooleanField(default=True)
    end_time = models.TimeField(help_text="Fecha y hora de finalización")
    start_date = models.DateField(null=True, blank=True, help_text="Desde qué fecha crear slots (inclusive)")
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    #ordenamos la tabla
    class Meta:
        ordering = ["business", "weekday", "start_time"]
        
    def __str__(self):
        return f"{self.business} - {self.name} {self.get_weekday_display()} {self.start_time}"


class ResourceSlot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ResourceTemplate, on_delete=models.CASCADE, related_name="slots")
    date = models.DateField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        #no puede haber dos registros con estos 3 campos iguales
        unique_together = ("template", "date", "start_datetime")
        
        #creamos indices para acelerar las consultas
        indexes = [
            models.Index(fields=["template", "date"]),
            models.Index(fields=["start_datetime"])
        ]
        ordering = ["start_datetime"]
    
    def clean(self):
        if self.end_datetime <= self.start_datetime:
            raise ValidationError("end_datetime debe ser posterior a start_datetime")
    
    def save(self, *args, **kwargs):
        #asegurarnos que end_datetime coincide con start + duration de la plantilla
        if self.template and self.start_datetime:
            expected_end = self.start_datetime + self.template.duration
            self.end_datetime = expected_end
        super().save(*args, **kwargs)                 
        
    def __str__(self):
        return f"{self.template.business} - {self.template.name} - {self.start_datetime.isoformat()}"
    
    
#Reserva asociada 1:1 a un slot concreto  
class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    STATUS_CHOICES = (("pending" , "pendiente"), ("confirmed", "confirmado"), ("cancelled", "cancelado"))
    slot = models.OneToOneField(ResourceSlot, on_delete=models.CASCADE, related_name="reservation")
    customer = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, validators=[RegexValidator(r'^\+?\d{8,15}$', message="Debe ser un número de teléfono válido")])
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    def  clean(self):
        #chequeo rapido: la fecha del slot debe ser futura
        if self.slot.start_datetime < timezone.now():
            raise ValidationError("No se puede reservar un slot en el pasado.")
    
    def save(self, *args, **kwargs):
        #guardado utilizando clean
        with transaction.atomic():
            self.full_clean()
            super().save(*args, **kwargs)