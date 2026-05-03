import logging
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management.base import BaseCommand
from django_apscheduler.jobstores import DjangoJobStore
from django.core.management import call_command


# Función para la lista de espera
def job_procesar_waitlist():
    print("Ejecutando proceso de lista de espera...")
    call_command("process_waitlist")

# Función para generar turnos
def job_generar_turnos():
    print("Generando turnos de la semana...")
    call_command("generate_slots")
    
class Command(BaseCommand):
    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")
        # Ejecutar lista de espera cada 10 minutos
        scheduler.add_job(
            job_procesar_waitlist,
            trigger=CronTrigger(minute="*/10"),
            id="procesar_waitlist",
            max_instances=1,
            replace_existing=True,
        )
        # Ejecutar generador de turnos cada domingo a las 3 AM
        scheduler.add_job(
            job_generar_turnos,
            trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
            id="generar_turnos_semanales",
            max_instances=1,
            replace_existing=True,
        )
        print("Iniciando Scheduler...")
        scheduler.start()