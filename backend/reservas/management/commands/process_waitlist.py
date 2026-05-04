from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from reservas.models import WaitlistEntry
from django.core.mail import send_mail
from reservas.models import Business, ResourceSlot, Reservation
from reservas.utils import offer_slot_to_waitlist
class Command(BaseCommand):

    help = 'Verifica si hay clientes que expiró su oferta y la reenvia a los siguientes en la waitlist'

    def handle(self, *args, **options):
        ahora = timezone.now()

        #PARTE 0: NO ofrecemos turnos disponibles a clientes que esten en la waitlist y tengan una reserva de seguro a menos de 12 horas
        pacientes_limpiar = WaitlistEntry.objects.filter(status="waiting")
        for espera in pacientes_limpiar:
        # Chequeamos si tiene un turno confirmado que esté por ocurrir (menos de 12hs)
            tiene_reserva_cercana = Reservation.objects.filter(
                patient__email=espera.email,
                slot__template__business=espera.business,
                status="confirmed",
                slot__start_datetime__lt=ahora + timedelta(hours=12),
                slot__start_datetime__gt=ahora
            ).exists()
            if tiene_reserva_cercana:
                espera.status = "expired"
                espera.save()
            
        
        # PARTE 1: LIMPIEZA DE OFERTAS EXPIRADAS
        # Buscamos a la gente que recibió una oferta pero se le pasaron las 2 horas
        ofertas_vencidas = WaitlistEntry.objects.filter(status="offered", offer_expires_at__lt=ahora)

        for oferta_vencida in ofertas_vencidas:
            slot_liberado = oferta_vencida.offered_slot

            # Marcamos su oferta como vencida
            oferta_vencida.status = "expired"
            oferta_vencida.save()

            self.stdout.write(self.style.WARNING(f"Oferta expirada para {oferta_vencida.first_name}."))

            # Intentamos dárselo a la siguiente persona que esté esperando
            margen_minimo = timedelta(hours=2)
            vale_la_pena = slot_liberado.start_datetime > (ahora + margen_minimo)
            
            if vale_la_pena:
                offer_slot_to_waitlist(slot_liberado)
            
        # PARTE 2: BÚSQUEDA PROACTIVA DE TURNOS LIBRES
        # Esto sirve para turnos que el doctor creó recién y están vacíos (sin reserva)
        for business in Business.objects.all():

            # Buscamos slots que estén "limpios" (sin reservas y sin ofertas actuales)
            slot_libres = ResourceSlot.objects.filter(
                template__business=business, 
                active=True, 
                start_datetime__gte = ahora + timedelta(hours=2)
            ).exclude(
                reservation__status = "confirmed"
            ).exclude(
                waitlistentry__status = "offered"
            ).order_by("start_datetime")

            # Para cada hueco libre que encontramos, llamamos a nuestro "cerebro" en utils.py
            for slot in slot_libres:
                offer_slot_to_waitlist(slot)

            
                    


                





            
        self.stdout.write(self.style.SUCCESS("Proceso de lista de espera completado."))


        
