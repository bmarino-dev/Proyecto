from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator


# Create your models here.

#clase sustituida de user
class User(AbstractUser):
    ROLE_CHOICES = (("customer", "Customer"), ("business", "Business"), ("staff", "Staff"))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")

class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_profile")
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
    
    
    
    
    
class Resource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    capacity = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    
    
class Reservation(models.Model):
    STATUS_CHOISES = (("pending" , "pendiente"), ("confirmed", "confirmado"), ("cancelled", "cancelado"))
    status = models.CharField(max_length=20, choices=STATUS_CHOISES, default="pending")
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="reservations")
    