# ReservaPro - Frontend (Next.js) 🚀

Este es el frontend del MVP de **ReservaPro**, una plataforma SaaS para la gestión de turnos y agendas de profesionales independientes. Construido con **Next.js (App Router)** y **Tailwind CSS**, este cliente se comunica con una API REST desarrollada en Django.

## 🌟 Características Principales

### 🏛️ Para Profesionales (B2B Dashboard)
- **Dashboard Moderno:** Visualización de próximos turnos con diseño glassmorphism.
- **Gestión de Agenda:** Creación de plantillas semanales y generación automática de slots.
- **Control de Ausencias:** Bloqueo de fechas específicas (vacaciones, feriados).
- **Gestión de Pacientes:** Base de datos de clientes con historial de visitas.
- **Seguridad:** Autenticación robusta mediante **JWT**.

### 👤 Para Pacientes (B2C Public Flow)
- **Reserva Self-Service:** Interfaz intuitiva para elegir profesional, fecha y hora.
- **Zero-Friction:** Los pacientes no necesitan crear cuenta para reservar.
- **Confirmación por Email:** Enlaces mágicos para confirmar o cancelar turnos con un solo clic.
- **Lista de Espera (Waitlist):** (En desarrollo ⏳) Inscripción automática si no hay turnos disponibles y reasignación inteligente.

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React / Emojis Premium
- **Autenticación:** JWT (JSON Web Tokens)
- **Fetching de Datos:** Fetch API / React Hooks (`useState`, `useEffect`)

## 🚀 Cómo empezar

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz con:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

3.  **Correr el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Abrir en el navegador:**
    Visita [http://localhost:3000](http://localhost:3000)

## 📐 Decisiones de Arquitectura

- **Make it Work, Make it Right, Make it Pretty:** El desarrollo siguió este mantra, priorizando primero la conexión funcional con la API y luego el pulido estético con Tailwind.
- **Snapshotting de Datos:** El frontend está sincronizado con la lógica de backend para mostrar los datos "congelados" de la reserva (`reservation_firstname`), garantizando que la información no cambie si el paciente actualiza su perfil.
- **Responsividad:** Diseñado con un enfoque *mobile-first* para que los pacientes puedan reservar cómodamente desde su celular.

---
Desarrollado con ❤️ por Bruno.
