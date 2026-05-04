from django.core.management.base import BaseCommand
from reservas.models import ResourceTemplate
from reservas.utils import generate_slots_for_template

class Command(BaseCommand):
    help = 'Genera slots para un negocio específico'

    def handle(self, *args, **options):
        self.stdout.write("Empezando el proceso de generacion de slots")
        total_nuevos_slots = 0
        templates_activas = ResourceTemplate.objects.filter(active = True)
        for template in templates_activas:
            nuevos_slots = generate_slots_for_template(template)
            total_nuevos_slots += nuevos_slots
            self.stdout.write(f"Generados {nuevos_slots} slots para la plantilla {template.name}")
        self.stdout.write(f"Proceso finalizado. Total de slots generados: {total_nuevos_slots}")    

