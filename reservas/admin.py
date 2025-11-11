from django.contrib import admin
from .models import Customer, Reservation, Resource, Business, User
# Register your models here.

admin.site.register(Customer)
admin.site.register(Resource)
admin.site.register(Reservation)
admin.site.register(Business)
admin.site.register(User)
