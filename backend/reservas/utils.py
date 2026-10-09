from datetime import datetime, timedelta, time as dtime, date as ddate
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from .models import Patient, ResourceSlot, Reservation, BlackOutDates, ResourceTemplate, Business, WaitlistEntry
from django.core.mail import send_mail

DEFAULT_GENERATE_DAYS = 30

#Devuelve "True" si day esta dentro de algun BlackOutDates del negocio.
def _is_blackout(business, day: ddate) -> bool:
    # Filtro más directo: la fecha debe estar entre start y end (o ser igual a start si end es null)
    return BlackOutDates.objects.filter(
        business=business
    ).filter(
        Q(start_date__lte=day, end_date__gte=day) | 
        Q(start_date=day, end_date__isnull=True)
    ).exists()


#Combina date + time y devuelve datetime aware según timezone actual.    
def _combine_aware(dt_date: ddate, dt_time: dtime):
    naive = datetime.combine(dt_date,dt_time)
    tz = timezone.get_current_timezone()
    return timezone.make_aware(naive, tz)


# Genera ResourceSlot a partir del template para los próximos días.
def generate_slots_for_template(template, days: int=DEFAULT_GENERATE_DAYS):
    
    # No generar turnos si la plantilla está desactivada.
    if not template.active:
        return 0
    
    business = template.business
    today = timezone.localdate()
    start_date = template.start_date or today
    if start_date < today:
        start_date = today
    
    end_date = start_date + timedelta(days=days)
    created = 0
    slots_to_create = []
    
    slot_duration = template.duration
    #si la sesion dura 0
    if not slot_duration or slot_duration <= timedelta(0):
        return 0
    
    curr = start_date
    
    while curr <= end_date:
        #solo generar en los dias de la semana indicados en el template
        if curr.weekday() == template.weekday:
            
            #si hay blackout, saltar
            if not _is_blackout(business,curr):
                #generar multiples slots en el dia: desde start_time hasta end_time - duration
                start_time = template.start_time
                end_time = template.end_time
                slot_start_time = start_time
                #crea slots mientras start_time <= end_time -duration
                while (datetime.combine(curr, slot_start_time) + slot_duration).time() <= end_time:
                    start_dt = _combine_aware(curr, slot_start_time)

                    end_dt = start_dt + slot_duration

                    existing_slot = ResourceSlot.objects.filter(
                        template=template,
                        date=curr,
                        start_datetime=start_dt,
                    ).first()

                    overlapping_slots = ResourceSlot.objects.filter(
                        template__business=business,
                        start_datetime__lt=end_dt,
                        end_datetime__gt=start_dt,
                    ).select_related("template")

                    if existing_slot:
                        overlapping_slots = overlapping_slots.exclude(
                            pk=existing_slot.pk,
                        )
                    
                    has_overlap = any(
                        slot.has_commitment
                        or (slot.active and slot.template.active)
                        for slot in overlapping_slots
                    )
                    if not has_overlap:
                        if existing_slot:
                            can_adjust_duration = (
                                not existing_slot.reservation.exists()
                                and not existing_slot.waitlistentry_set.exists()
                            )
                            if (
                                start_dt > timezone.now()
                                and not existing_slot.has_commitment
                                and (
                                    existing_slot.end_datetime == end_dt
                                    or can_adjust_duration
                                )
                            ):
                                ResourceSlot.objects.filter(
                                    pk=existing_slot.pk,
                                ).update(
                                    active=True,
                                    end_datetime=end_dt,
                                )
                        else:
                            rs = ResourceSlot(
                                template=template,
                                date=curr,
                                start_datetime=start_dt,
                                end_datetime=end_dt,
                            )
                            slots_to_create.append(rs)
                    
                    #avanzar por duracion
                    naive_dt = datetime.combine(curr, slot_start_time) + slot_duration
                    slot_start_time = naive_dt.time()
                    
        curr += timedelta(days=1)
     
    #mientras hayan slots guardamos estos con bulk_create y manualmente les agregamos el end_datetime    
    if slots_to_create:
        
        with transaction.atomic():
            for s in slots_to_create:
                s.end_datetime = s.start_datetime + slot_duration
            ResourceSlot.objects.bulk_create(slots_to_create)
            created = len(slots_to_create)
    
    return created        
                
    
def offer_slot_to_waitlist(slot):
    """
    Lógica de reasignación inteligente:
    Busca al paciente más antiguo en la lista de espera del negocio 
    y le ofrece el slot recién liberado por un tiempo limitado (2hs).
    """

    if _is_blackout(slot.template.business, slot.date):
        return

    if not slot.template.active:
        return
    # 1. Guardamos el slot que se liberó
    slot_liberado = slot
    
    # 2. Buscamos a toda la gente que está en la lista de espera de este negocio
    # Los ordenamos por fecha de creación para respetar el orden de llegada (FIFO)
    pacientes = WaitlistEntry.objects.filter(
        business=slot_liberado.template.business, 
        status = "waiting"
        ).order_by("created_at")

    # 3. Empezamos a revisar uno por uno a ver a quién le sirve este turno
    for paciente in pacientes:
        # Buscamos si el paciente ya tiene una reserva confirmada con este mismo profesional
        reserva_actual = Reservation.objects.filter(
            slot__start_datetime__gt=timezone.now(),
            patient__email=paciente.email, 
            slot__template__business=slot.template.business, 
            status="confirmed"
        ).order_by("slot__start_datetime").first()

        # 4. CONDICIÓN: Se lo ofrecemos si no tiene nada aún O si este turno es más temprano que el que ya tiene
        if not reserva_actual or slot.start_datetime < reserva_actual.slot.start_datetime:
            
            # Le asignamos el turno temporalmente por 2 horas
            paciente.offered_slot = slot_liberado
            paciente.offer_expires_at = timezone.now() + timedelta(hours=2)
            paciente.status = "offered"
            paciente.save()

            # Le armamos el link y el mail personalizado
            link_oferta = f"http://localhost:3000/waitlist/claim/{paciente.id}/"
            mensaje_espera = f"""
                Hola {paciente.first_name},
                ¡Se ha liberado un turno para ti!
                Fecha: {slot_liberado.start_datetime.strftime('%d/%m/%Y %H:%M')}
                Tienes 2 horas para reclamarlo haciendo clic aquí: {link_oferta}
                """
            send_mail(
                    "¡Turno Disponible! Lista de Espera",
                    mensaje_espera,
                    "soporte@miapp.com",
                    [paciente.email],
                    fail_silently=False,
                    )
            
            # 5. IMPORTANTE: Una vez que encontramos a alguien, cortamos el bucle (break)
            # para no ofrecerle el mismo turno a 20 personas a la vez.
            break
        
