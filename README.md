# API de Reservas para Profesionales Independientes

Una API RESTful robusta construida con **Django** y **Django REST Framework (DRF)**, diseñada para que profesionales independientes (psicólogos, nutricionistas, fisioterapeutas, etc.) gestionen sus pacientes, disponibilidades y reservas. 

Este backend provee un flujo completo que incluye generación automática de slots en base a plantillas semanales y un sistema de confirmación de turnos vía links únicos por e-mail, sin requerir que los pacientes se registren en la plataforma.

## 🚀 Características Principales (Features)

* **Autenticación Segura (JWT)**: Login de profesionales utilizando JSON Web Tokens para una correcta gestión del acceso a la API.
* **Gestión de Pacientes**: Un profesional puede registrar, consultar y actualizar datos de sus propios pacientes.
* **Generación Automática de Slots**: Configuración de `ResourceTemplates` (ej: Todos los lunes de 9:00 a 12:00 en sesiones de 50 min), con los que la API genera automáticamente los turnos (slots) reales.
* **Flujo de Reservas Público**: Los turnos se confirman por medio de un token criptográfico enviado al e-mail del paciente, permitiendo confirmar o cancelar con un solo clic de forma anónima, sin necesidad de cuentas ni contraseñas temporales adicionales.
* **Días Libres/Feriados (BlackOutDates)**: El sistema no genera turnos sobre fechas marcadas como bloqueadas por el profesional.
* **Paginación Inteligente**: Listados paginados integrados para garantizar el rendimiento escalable de la base de datos y facilitar la integración con el Front-End.
* **Aislamiento por Perfiles**: Cada profesional (Business) solo tiene acceso a sus propios pacientes y reservas.

---

## 🛠 Entorno de Desarrollo y Requisitos

- Python 3.12 o superior.
- [Dependencias listadas en `requirements.txt`](requirements.txt)

---

## 💻 Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_CARPETA_PROYECTO>
   ```

2. **Crear y activar un entorno virtual**
   ```bash
   # En Windows:
   python -m venv .venv
   .\.venv\Scripts\activate

   # En Mac/Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Instalar las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar Variables de Entorno (.env)**
   Debés crear un archivo `.env` en la raíz del proyecto (junto a `manage.py`) con las siguientes variables:
   ```env
   SECRET_KEY=tu-secret-key-super-secreta-random-aqui
   DEBUG=True
   ALLOWED_HOSTS=127.0.0.1,localhost
   ```

5. **Aplicar las Migraciones y lanzar el servidor local**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   *La API estará disponible en `http://127.0.0.1:8000`.*

---

## 🔗 Endpoints de la API

A continuación la lista principal de los endpoints disponibles. Todos los endpoints (excepto Auth y Confirmación Pública) requieren enviar un header HTTP: `Authorization: Bearer <tu_access_token>`.

### Autenticación (Públicos)
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/signup/` | Registra un nuevo profesional (psicólogo, nutricionista, etc). |
| `POST` | `/auth/login/` | Inicia sesión (devuelve `access` y `refresh` tokens). |
| `POST` | `/auth/token/refresh/` | Renueva el access token usando el refresh token. |

### Reservas y Slots (Privados)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/slots/` | Lista todos los slots disponibles futuros del profesional. Admite query `?date=YYYY-MM-DD`. |
| `GET, POST` | `/reservations/` | Lista o crea las reservas hechas por pacientes a ciertos slots. |
| `PATCH` | `/reservations/<id>/cancel/` | Cancela una reserva específica identificada por su ID UUID. |

### Confirmación Pública (Públicos)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/confirm/<token>/` | El paciente confirma el turno sin loguearse. |
| `GET` | `/confirm/<token>/?cancel=1`| El paciente cancela el turno sin loguearse. |

### Entidades Privadas del Profesional (Requiere Login)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET, POST` | `/patients/` | Lista o crea pacientes asociados al profesional logueado. |
| `PATCH, DEL`| `/patients/<id>/` | Actualiza o elimina un paciente determinado. |
| `GET, POST` | `/blackouts/` | Gestión de fechas bloqueadas que restringen la generación de turnos futuros. |
| `PATCH, DEL`| `/blackouts/<id>/` | Detalle, actualización y borrado de fechas bloqueadas. |

---

---

## 🤖 Sobre este Proyecto y el Uso de IA

Este backend fue desarrollado como un MVP para consolidar y demostrar mis conocimientos en Python, Django y construcción de APIs RESTful. 

Para alcanzar el nivel de robustez y buenas prácticas presentes en este código, he utilizado **inteligencia artificial como herramienta de asistencia y *pair programming***. Mi enfoque no fue generar código de forma ciega, sino utilizar la IA como un mentor interactivo:
1. **Diseño y Arquitectura:** Escribí la base y la lógica estructural del proyecto.
2. **Cuestionamiento Activo:** En lugar de copiar soluciones, cuestioné cada implementación ("¿por qué JWT?", "¿cómo funciona realmente la paginación?", "¿por qué este test falla en esta zona horaria?").
3. **Refactorización:** Apliqué mejoras sugeridas por la IA (como separar configuraciones en `.env`, optimizar `.gitignore` y agregar endpoints faltantes) solo después de estudiar y comprender profundamente qué problema resolvían.

El objetivo de este repositorio es reflejar una API funcional, pero principalmente documentar un **proceso de aprendizaje activo**, demostrando mi capacidad para leer, auditar, depurar e integrar soluciones de nivel profesional en un flujo de trabajo moderno rodeado de nuevas herramientas.

---

*Bruno Marino.*
