from django.test import TestCase
from django.utils import timezone
from datetime import timedelta, date, time
from rest_framework.test import APIClient
from django.urls import reverse
from .models import User, Business, Patient, ResourceTemplate, ResourceSlot, Reservation
from .utils import generate_slots_for_template

class ReservationMVPTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario y negocio
        self.user = User.objects.create_user(
            username="testdoctor", 
            email="doc@test.com", 
            password="testpassword123",
            role="business"
        )
        self.business = Business.objects.create(
            user=self.user,
            phone="1234567890",
            specialty="psychology"
        )
        
        # Crear paciente
        self.patient = Patient.objects.create(
            business=self.business,
            first_name="Juan",
            last_name="Perez",
            email="juan@test.com",
            phone="0987654321"
        )

    def test_signup_creates_business(self):
        """Prueba que el signup cree correctamente el User y el Business asociado."""
        response = self.client.post(reverse('signup'), {
            "username": "newdoctor",
            "email": "new@test.com",
            "first_name": "Ana",
            "last_name": "Gomez",
            "password": "strongpassword123",
            "phone": "1122334455",
            "specialty": "nutrition"
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username="newdoctor").exists())
        self.assertTrue(Business.objects.filter(user__username="newdoctor").exists())

    def test_generate_slots_for_template(self):
        """Prueba la lógica de negocio de generación de turnos a partir de una plantilla."""
        today = timezone.localdate()
        # Buscar el próximo lunes (weekday 0)
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0: # si hoy es martes o más tarde, buscar el lunes de la proxima semana
            days_ahead += 7
        next_monday = today + timedelta(days=days_ahead)

        # Crear plantilla de lunes de 9:00 a 11:00 con duración de 1 hora (2 slots)
        template = ResourceTemplate.objects.create(
            business=self.business,
            name="Lunes Mañana",
            weekday=0, # Lunes
            start_time=time(9, 0),
            end_time=time(11, 0),
            duration=timedelta(hours=1),
            start_date=next_monday
        )

        created = generate_slots_for_template(template, days=6) # generar por menos de 7 días exactos para no pisar el próx lunes
        
        # Debería crear exactamente 2 slots: 09:00 a 10:00 y 10:00 a 11:00
        self.assertEqual(created, 2)
        
        slots = ResourceSlot.objects.filter(template=template).order_by('start_datetime')
        self.assertEqual(slots.count(), 2)
        
        # En la base de datos se guarda en UTC pero start_time del template se asume en localtime
        tz = timezone.get_current_timezone()
        self.assertEqual(slots[0].start_datetime.astimezone(tz).time(), time(9, 0))
        self.assertEqual(slots[1].start_datetime.astimezone(tz).time(), time(10, 0))

    def test_jwt_authentication(self):
        """Prueba que el login devuelve tokens JWT válidos."""
        response = self.client.post(reverse('token_obtain_pair'), {
            "username": "testdoctor",
            "password": "testpassword123"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        # Usar el token para acceder a un endpoint protegido
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        patients_response = self.client.get(reverse('patient-list'))
        self.assertEqual(patients_response.status_code, 200)
        self.assertEqual(len(patients_response.data['results']), 1) # Debería traer al paciente 'Juan Perez'
