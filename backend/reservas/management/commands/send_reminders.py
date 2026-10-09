from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from reservas.models import Reservation
from django.core.mail import send_mail


class Command(BaseCommand):

    help = "recordatorios de proximo turno via mail"

    def handle(self, *args, **options):
        ahora = timezone.now()
        limite_48 = timedelta(hours=48)
        limite_24 = timedelta(hours=24)
        
        
        #para los turnos ya ocupados, corroboramos cuanto falta a partir de ahora
        turnos_reservados = Reservation.objects.filter(status="confirmed")
        for turno_reservado in turnos_reservados:
            tiempo_faltante = turno_reservado.slot.start_datetime - ahora
            link_cancelacion = f"http://localhost:8001/confirm/{turno_reservado.confirmation_token}/?cancel=1"
            #si falta menos de 48 horas pero mas de 24 y ademas es el primer mail enviado automaticamente
            if (limite_24 < tiempo_faltante <= limite_48 and turno_reservado.reminder_count == 0):
                mensaje_aviso1 = f"""
                Hola {turno_reservado.patient.first_name},
                Recuerda asistir a tu reserva con {turno_reservado.slot.template.business.full_name}, el dia {timezone.localtime(turno_reservado.slot.start_datetime).strftime('%d/%m/%Y %H:%M')}
                ¡Quedan menos de 48hs!
                En caso de que no sea posible tu asistencia, porfavor ayudanos cancelando aqui
                {link_cancelacion}
                """

                send_mail(
                    "¡Recuerda asistir!",
                    mensaje_aviso1,
                    "soporte@miapp.com",
                    [turno_reservado.patient.email],
                    fail_silently=False,
                )

                turno_reservado.reminder_count += 1
                turno_reservado.last_reminder_sent_at = timezone.now()
                turno_reservado.save(
                    update_fields=[
                        "reminder_count",
                        "last_reminder_sent_at",
                    ],
                )
            
            #si faltan menos de 24 horas pero mas de 0 y ademas es el segundo mail a enviar
            elif (
                timedelta(0) < tiempo_faltante <= limite_24
                and turno_reservado.reminder_count < 2
                and (
                    turno_reservado.last_reminder_sent_at is None
                    or turno_reservado.last_reminder_sent_at
                    < turno_reservado.slot.start_datetime - limite_24
                )
            ):  
                
                mensaje_aviso2 = f"""
                Hola {turno_reservado.patient.first_name},
                Recuerda asistir a tu reserva con {turno_reservado.slot.template.business.full_name}, el dia {timezone.localtime(turno_reservado.slot.start_datetime).strftime('%d/%m/%Y %H:%M')}
                ¡Quedan menos de 24hs!
                 Insistimos, en caso de que no sea posible tu asistencia, porfavor, ayudanos cancelando aqui
                {link_cancelacion}
                """

                send_mail(
                    "¡Ultimo recordatorio!",
                    mensaje_aviso2,
                    "soporte@miapp.com",
                    [turno_reservado.patient.email],
                    fail_silently=False,
                )

                turno_reservado.reminder_count += 1
                turno_reservado.last_reminder_sent_at = timezone.now()
                turno_reservado.save(
                    update_fields=[
                        "reminder_count",
                        "last_reminder_sent_at",
                    ],
                )