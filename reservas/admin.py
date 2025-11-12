from django.contrib import admin
from .models import Customer, Reservation, ResourceSlot, ResourceTemplate, Business, User
# Register your models here.

admin.site.register(Customer)
admin.site.register(Business)
admin.site.register(ResourceTemplate)
admin.site.register(ResourceSlot)
admin.site.register(Reservation)
admin.site.register(User)
