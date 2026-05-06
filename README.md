# API y Plataforma SaaS de Reservas para Profesionales

Una plataforma Full-Stack robusta diseñada para que profesionales independientes (psicólogos, nutricionistas, fisioterapeutas, etc.) gestionen sus pacientes, disponibilidades y reservas. 

El proyecto consta de un backend potente (Django REST Framework) y un frontend moderno (Next.js con App Router y Tailwind CSS), proveyendo un flujo completo desde la generación automática de slots hasta la reserva y gestión de lista de espera.

## 🚀 Características Principales (Features)

* **Arquitectura Full-Stack Separada**: Backend API-First y un Frontend B2B/B2C independiente consumiendo los endpoints.
* **Autenticación Segura (JWT)**: Login de profesionales utilizando JSON Web Tokens. El Frontend gestiona el estado y protege las rutas privadas (Dashboard).
* **Gestión de Pacientes y Dashboard Premium**: Interfaz moderna (Glassmorphism) para que el profesional visualice sus próximos turnos y gestione su clínica.
* **Generación Automática de Slots**: Configuración de `ResourceTemplates` en el backend para generar automáticamente los turnos reales evadiendo fechas bloqueadas (`BlackOutDates`).
* **Flujo de Reservas Público (Self-Service)**: Formulario público interactivo donde los pacientes pueden ver disponibilidad y asegurar su turno al instante (las reservas nacen como confirmadas para reducir fricción).
* **Gestión de Cancelación One-Click**: Los pacientes reciben un link seguro por e-mail para cancelar su turno con un solo clic sin necesidad de registrarse.
* **Lista de Espera Inteligente (Waitlist FIFO)**: (Próximamente en Frontend) Cuando un turno es cancelado, el sistema automáticamente le ofrece el lugar liberado al primer paciente en la lista de espera, otorgándole un tiempo límite para aceptarlo antes de pasar al siguiente.
* **Documentación Automática OpenAPI (Swagger)**: Esquema autogenerado para consultar y probar la API.

---

## 🛠 Entorno de Desarrollo y Requisitos

- Python 3.12+
- Node.js 18+ y npm
- Docker Desktop (Recomendado)

---

## 💻 Instalación y Ejecución Local

### Opción A: Todo con Docker (Recomendada)
El proyecto está 100% "Dockerizado".
1. Clonar el repositorio.
2. Ejecutar: `docker-compose up --build`
3. Backend disponible en `http://localhost:8001` y Frontend en `http://localhost:3000`.

### Opción B: Ejecución Manual

**1. Backend (Django)**
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

**2. Frontend (Next.js)**
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 Estructura de Endpoints de la API (Resumen)

El esquema completo puede consultarse en `http://localhost:8001/api/docs/`.

### Públicos (B2C)
* `GET /public/slots/?business_id=...` : Vidriera de turnos libres.
* `POST /public/reservations/` : Creación de reserva.
* `GET /confirm/<token>/` : Confirmación/Cancelación por email.
* `POST /public/business/<uuid>/waitlist/` : Anotarse en lista de espera.

### Privados (B2B - Requieren JWT)
* `POST /auth/login/` : Obtención de Token.
* `GET /reservations/` : Listado de reservas del profesional logueado.
* `GET, POST /patients/`, `/templates/`, `/blackouts/` : Gestión interna clínica.

---

## 🤖 Sobre este Proyecto y el Uso de IA

Este proyecto fue desarrollado como un MVP para consolidar conocimientos en desarrollo Full-Stack. Para alcanzar el nivel de robustez actual, he utilizado **inteligencia artificial como herramienta de asistencia y *pair programming***.

Mi enfoque no fue generar código de forma ciega, sino utilizar la IA como un mentor interactivo:
1. **Diseño y Arquitectura:** Escribí la base y cuestioné cada implementación ("¿Por qué JWT?", "¿Cómo funciona el async/await en React?", "¿Por qué se bloquea la BD para evitar Race Conditions?").
2. **Desarrollo Iterativo (MVP):** Construí primero la funcionalidad "fea pero segura" y luego apliqué las capas visuales (Tailwind CSS).
3. **Refactorización Continua:** Separación de lógica y vista, manejo seguro de variables de entorno y optimización de componentes de React.

El objetivo de este repositorio documentar un **proceso de aprendizaje activo**, demostrando mi capacidad para construir soluciones B2B y B2C completas en un flujo de trabajo moderno rodeado de nuevas herramientas.

*Bruno Marino.*
