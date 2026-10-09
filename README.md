# Plataforma de reservas para profesionales

MVP para gestionar disponibilidad, pacientes y reservas. La API usa Django REST Framework y el frontend usa Next.js con App Router.

Estado documentado al **9 de octubre de 2026**. Las funciones principales están implementadas, con pendientes de funcionamiento e integridad. No se considera validado para producción.

## Mapa para retomar el proyecto

| Ubicación | Responsabilidad |
|---|---|
| `backend/reservas/models.py` | Entidades, relaciones y disponibilidad |
| `backend/reservas/serializers.py` | Validación y creación de entidades y reservas |
| `backend/reservas/views.py` | API privada/pública, cancelación y reclamo de ofertas |
| `backend/reservas/utils.py` | Generación de turnos y selección de lista de espera |
| `backend/reservas/management/commands/` | Procesos periódicos y recordatorios |
| `frontend/app/` | Panel profesional, reserva pública y lista de espera |
| `.github/workflows/django.yml` | Tests del backend en CI |

- [Contexto de arquitectura](backend/CONTEXTO_ARQUITECTURA.md): reglas, decisiones y pendientes técnicos. Está ignorado por Git; puede faltar en un clon nuevo.
- [README del frontend](frontend/README.md): rutas, sesión y conexión con la API.
- [Instrucciones del frontend](frontend/AGENTS.md): convenciones para trabajar en esa carpeta.

## Funciones implementadas

- Registro y login de profesionales con JWT.
- Dashboard que consulta perfil y reservas; interfaces para listar, crear y eliminar horarios y ausencias.
- API para administrar pacientes, plantillas, ausencias y reservas propias.
- Generación de turnos desde plantillas semanales, omitiendo ausencias al generar.
- Reserva pública sin cuenta de paciente; las reservas nacen como `confirmed`.
- Cancelación pública por token UUID y cancelación privada por API.
- Inscripción pública en lista de espera y página para consultar y aceptar ofertas de hasta dos horas.
- Selección de candidatos por antigüedad entre quienes cumplen las condiciones de la oferta.
- Documentación OpenAPI y Swagger.

La API de pacientes y la cancelación privada existen, pero no hay pantalla de gestión de pacientes ni botón de cancelación en el dashboard. Los correos se imprimen en consola con la configuración actual.

## Tecnologías y requisitos

Versiones declaradas en `backend/requirements.txt` y `frontend/package.json`:

- Python 3.12 o superior; Docker y CI usan 3.12.
- Django 6.0.2, DRF 3.16.1 y SimpleJWT 5.5.1.
- PostgreSQL en ejecución normal; Compose usa PostgreSQL 15.
- SQLite para `manage.py test`, según la selección en settings.
- Next.js 16.2.4, React 19.2.4 y Tailwind CSS 4.
- Node.js 20.9.0 o superior y npm, según el requisito del paquete Next.js instalado.
- Docker Desktop con Compose para ejecutar base de datos y backend en contenedores.

## Ejecución local: Docker y frontend separado

Compose incluye `db`, `web` y `scheduler`. **No contiene un servicio para el frontend.** El backend usa el servidor de desarrollo de Django.

1. Creá `.env` en la raíz para las variables que interpola Compose:

   ```dotenv
   DB_NAME=reservas
   DB_USER=reservas
   DB_PASSWORD=reemplazar_por_una_clave_local
   RESEND_API_KEY=
   ```

2. Creá `backend/.env` para la configuración que lee Django. Compose pasa las variables de base de datos, pero no inyecta `SECRET_KEY`:

   ```dotenv
   SECRET_KEY=reemplazar_por_una_clave_aleatoria_local
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

   Usá claves propias. Los archivos `.env` están ignorados por Git; no subir sus valores al repositorio.

3. Desde la raíz, iniciá PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

4. Cuando PostgreSQL esté listo, aplicá migraciones e iniciá backend y scheduler:

   ```powershell
   docker compose run --rm web python manage.py migrate
   docker compose up --build web scheduler
   ```

   `depends_on` no comprueba que PostgreSQL acepte conexiones. Compose tampoco aplica migraciones automáticamente.

5. En otra terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Direcciones locales:

- Frontend: <http://localhost:3000>
- API: <http://localhost:8001>
- Swagger: <http://localhost:8001/api/docs/>

El frontend tiene `http://localhost:8001` escrito directamente en sus consultas. No consume `NEXT_PUBLIC_API_URL`.

## Backend sin Docker

Necesitás PostgreSQL accesible desde Windows. El servicio `db` de Compose no publica su puerto al host: su configuración actual no permite conectar directamente un backend ejecutado fuera de los contenedores.

Configurá `backend/.env` con `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`. Para PostgreSQL local usá `DB_HOST=localhost` y el puerto de tu instancia. El valor por defecto `db` corresponde a la red de Compose.

Desde la raíz:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver 8001
```

En otra terminal, con el mismo entorno activado y dentro de `backend`, ejecutá `python manage.py run_scheduler` para iniciar los procesos periódicos.

## API principal

Las rutas están en la raíz del backend, sin prefijo `/api/`, salvo la documentación. Los listados genéricos usan páginas de 20 elementos (`count`, `next`, `previous`, `results`).

| Acceso | Método y ruta | Función |
|---|---|---|
| Público | `POST /auth/signup/` | Registrar profesional |
| Público | `POST /auth/login/` | Obtener tokens de acceso y renovación |
| Público | `POST /auth/token/refresh/` | Renovar acceso |
| Público | `POST /auth/password-reset/` y `/auth/password-reset-confirm/` | Recuperación; falta la página de destino en el frontend |
| Público | `GET /public/business/<uuid>/` | Perfil profesional |
| Público | `GET /public/slots/?business_id=<uuid>&date=YYYY-MM-DD` | Turnos disponibles; fecha opcional |
| Público | `POST /public/reservations/` | Reservar turno |
| Público | `GET /confirm/<token>/?cancel=1` | Cancelar; sin `cancel`, informa que ya está confirmado |
| Público | `POST /public/business/<uuid>/waitlist/` | Inscribirse en lista de espera |
| Público | `GET, POST /public/waitlist/<uuid>/claim/` | Consultar o aceptar oferta |
| JWT | `GET, PATCH, PUT /business/me/` | Consultar o actualizar perfil |
| JWT | `GET, POST /patients/`, `/templates/`, `/blackouts/` | Listar o crear entidades propias |
| JWT | `GET, PATCH, PUT, DELETE /patients/<uuid>/`, `/templates/<uuid>/`, `/blackouts/<uuid>/` | Administrar entidad propia |
| JWT | `GET, POST /reservations/` | Listar o crear reservas |
| JWT | `PATCH /reservations/<uuid>/cancel/` | Cancelar reserva propia |

## Procesos y verificación

`run_scheduler` programa `process_waitlist` cada 10 minutos y `generate_slots` los domingos a las 03:00. Django está configurado con `America/Montevideo`; los disparadores no especifican zona propia, por lo que falta comprobar el horario efectivo en ejecución. `send_reminders` existe, pero no está programado y requiere correcciones.

Desde `backend`, con el entorno activado:

```powershell
python manage.py test reservas
```

Desde `frontend`:

```powershell
npm run lint
npm run build
```

La suite del backend incluye pruebas funcionales y de concurrencia. Por defecto usa SQLite y omite los escenarios que requieren bloqueos reales. Para ejecutar toda la suite sobre una base de pruebas separada en PostgreSQL, desde la raíz:

```powershell
docker compose exec -e TEST_USE_POSTGRES=1 web python manage.py test reservas --noinput
```

Al completar el caso 9 pasaron 32 tests en PostgreSQL, incluidos ocho escenarios simultáneos. En SQLite pasan 24 y se omiten los ocho de concurrencia. Las pruebas simultáneas cubren reservas públicas y manuales sobre el mismo turno, aceptación doble de ofertas, asignación concurrente de ofertas y cancelaciones. Los correos de prueba se guardan en memoria. La prueba secuencial anterior sigue existiendo con un nombre que distingue su alcance. Estas pruebas no validan todo el flujo del frontend.

## Limitaciones conocidas

1. **Consistencia de reservas corregida:** reservas públicas y manuales, ofertas, reclamos y cancelaciones usan transacciones y bloqueos. Una restricción impide más de una reserva confirmada por turno, conservando las canceladas. Los conflictos conocidos devuelven errores entendibles; los correos y las nuevas ofertas se ejecutan después de confirmar la transacción. La entrega de correos sigue sin tener una cola de reintentos persistente.
2. **Disponibilidad:** crear ausencias no retira turnos existentes. Cambiar o desactivar plantillas no sincroniza sus turnos anteriores, y el listado público no filtra por plantilla activa.
3. **Historial:** borrar pacientes o plantillas puede eliminar reservas por cascada.
4. **Correos:** se usa consola. La cancelación de la reserva apunta al puerto `8000`; los recordatorios apuntan a una ruta inexistente del frontend y acceden a `slot.business`, atributo inexistente.
5. **Sesión y configuración:** el frontend guarda solo el acceso JWT en `localStorage`, sin renovación. Las direcciones de API y correo están fijadas a localhost.
6. **Pruebas:** falta cubrir lista de espera, ausencias, aislamiento entre profesionales y concurrencia real en PostgreSQL.

Estos puntos describen errores funcionales y riesgos de integridad observados en el código. La revisión no es una auditoría completa de seguridad ni confirmó acceso no autorizado a datos de otros profesionales.

## Desarrollo y aprendizaje

Proyecto de Bruno Marino para consolidar conocimientos de desarrollo full stack, con asistencia de IA para aprendizaje y programación colaborativa. El enfoque es implementar la funcionalidad, revisar su consistencia y luego mejorar la presentación.
