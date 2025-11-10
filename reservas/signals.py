#from django.db.models.signals import post_save
#from django.dispatch import receiver
#from django.conf import settings
#from .models import Customer

#@receiver(post_save, sender= settings.AUTH_USER_MODEL)
#def crear_perfil_customer(sender, instance, created, **kwargs):
#    if created and instance.role == "customer":
#        Customer.objects.update_or_create(user=instance)
        