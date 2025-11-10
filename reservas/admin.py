from django.contrib import admin
from .models import Customer, Reservation, Resource
# Register your models here.

admin.site.register(Customer)
admin.site.register(Resource)
admin.site.register(Reservation)
