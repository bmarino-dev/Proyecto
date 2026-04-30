from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from reservas.models import WaitlistEntry
from django.core.mail import send_mail

class Command(BaseCommand):

    help = 'Verifica si hay clientes que expiró su oferta y la reenvia a los siguientes en la waitlist'

    def handle(self, *args, **options):
        ahora = timezone.now()
        
        #Buscamos las ofertas que ya vencieron
        ofertas_vencidas = WaitlistEntry.objects.filter(status="offered", offer_expires_at__lt=ahora)

        if not ofertas_vencidas.exists():
            self.stdout.write(self.style.SUCCESS("No hay ofertas expiradas para procesar."))
            return

        for oferta_vencida in ofertas_vencidas:
            slot_liberado = oferta_vencida.offered_slot

            #Le quitamos la oferta a los expirados
            oferta_vencida.status = "expired"
            oferta_vencida.save()

            self.stdout.write(self.style.WARNING(f"Oferta expirada para {oferta_vencida.first_name}."))

            #Buscamos al siguiente cliente en la waitlist
            siguiente_esperando = WaitlistEntry.objects.filter(
                business=oferta_vencida.business,
                status="waiting"
            ).order_by("created_at").first()

            if siguiente_esperando:
                siguiente_esperando.offered_slot = slot_liberado
                siguiente_esperando.offer_expires_at = ahora + timedelta(hours=2)
                siguiente_esperando.status = "offered"
                siguiente_esperando.save()

                # Le mandamos el mail al nuevo afortunado
                link_oferta = f"http://localhost:3000/waitlist/claim/{siguiente_esperando.id}/"
                mensaje_espera = f"""
                Hola {siguiente_esperando.first_name},
                ¡Se ha liberado un turno para ti!
                Fecha: {slot_liberado.start_datetime.strftime('%d/%m/%Y %H:%M')}
                Tienes 2 horas para reclamarlo haciendo clic aquí: {link_oferta}
                """
                send_mail(
                    "¡Turno Disponible! Lista de Espera",
                    mensaje_espera,
                    "soporte@miapp.com",
                    [siguiente_esperando.email],
                    fail_silently=False,
                )
                self.stdout.write(self.style.SUCCESS(f"Nueva oferta enviada a {siguiente_esperando.first_name}."))
        self.stdout.write(self.style.SUCCESS("Proceso de lista de espera completado."))


        
