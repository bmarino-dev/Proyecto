from django.contrib import admin
from .models import Customer, Reservation, ResourceSlot, ResourceTemplate, Business, User, BlackOutDates
from .utils import generate_slots_for_template
# Register your models here.

admin.site.register(Customer)
admin.site.register(Business)
admin.site.register(BlackOutDates)
admin.site.register(ResourceSlot)
admin.site.register(Reservation)
admin.site.register(User)

@admin.register(ResourceTemplate)
class ResourceTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "business", "weekday", "start_time", "end_time"]
    actions = ["generate_slots_action"]

    @admin.action(description="Generar slots para los templates seleccionados")
    def generate_slots_action(self, request, queryset):
        total = 0
        for template in queryset:
            created = generate_slots_for_template(template)
            total += created
        self.message_user(request, f"Se generaron {total} slots en total.")
