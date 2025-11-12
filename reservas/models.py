from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils import timezone




#clase sustituida de user
class User(AbstractUser):
    ROLE_CHOICES = (("customer", "Cliente"), ("business", "Negocio"), ("staff", "Staff"))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="business")

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
    
#Perfil de negocios    
class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_profile")
    phone = models.CharField(max_length=20, blank=True, validators= [RegexValidator(r'^\+?\d{8,15}$', message="Debe ser un número de teléfono válido")])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.user.username
    
    @property
    def email(self):
        return self.user.email
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()    
    
    
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
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="resource_template")
    name = models.CharField(max_length=150)
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField(help_text="Hora de inicio (ej: 09:00)")
    duration = models.DurationField(help_text="Duración del slot (ej: 00:30:00)")
    active = models.BooleanField(default=True)
    end_time = models.DateTimeField(help_text="Fecha y hora de finalización")
    start_date = models.DateField(null=True, blank=True, help_text="Desde qué fecha crear slots (inclusive)")
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        ordering = ["business", "weekday", "start_time"]
        
    def __str__(self):
        return f"{self.business} - {self.name} {self.get_weekday.display()} {self.start_time}"
        
    
    
#modelo de cada reserva    
class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    STATUS_CHOICES = (("pending" , "pendiente"), ("confirmed", "confirmado"), ("cancelled", "cancelado"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="reservations")
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, validators= [RegexValidator(r'^\+?\d{8,15}$', message="Debe ser un número de teléfono válido")])
    
    