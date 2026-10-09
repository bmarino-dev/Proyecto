# Frontend de la plataforma de reservas

Cliente Next.js de la API de Django. Estado documentado al **9 de octubre de 2026**. Incluye panel profesional, reserva pública y lista de espera; no todos los flujos están validados de extremo a extremo.

## Tecnologías

- Next.js 16.2.4 con App Router.
- React y React DOM 19.2.4.
- Tailwind CSS 4 con PostCSS.
- Fetch API y hooks de React.
- ESLint 9 con configuración Next.js.
- Iconos mediante emojis y recursos gráficos; `lucide-react` no figura en las dependencias.

El paquete Next.js instalado declara Node.js `>=20.9.0`. Las versiones del proyecto están en `package.json`.

## Ejecución

Con la API funcionando en `http://localhost:8001`, desde esta carpeta:

```powershell
npm install
npm run dev
```

Abrí <http://localhost:3000>. El frontend se ejecuta por separado; el Compose de la raíz no incluye Next.js.

Las consultas tienen `http://localhost:8001` escrito directamente. **Crear `.env.local` con `NEXT_PUBLIC_API_URL` no cambia el destino**: el código actual no lee esa variable. Centralizarla es trabajo pendiente.

La configuración de Django, PostgreSQL y Docker está en el [README principal](../README.md).

## Páginas y componentes

| Ruta o archivo | Función implementada |
|---|---|
| `/` y `/demo` | Presentación y demostración |
| `/signup` | Registro profesional |
| `/login` | Login con usuario y contraseña |
| `/dashboard` | Consulta del perfil y listado de reservas |
| `/dashboard/horarios` | Listar, crear y eliminar plantillas semanales |
| `/dashboard/ausencias` | Listar, crear y eliminar ausencias |
| `/reservar/[business_id]` | Perfil público y calendario para reservar |
| `/reservar/[business_id]/waitlist` | Inscripción pública en lista de espera |
| `/waitlist/claim/[id]` | Consultar oferta y aceptarla mediante POST |
| `app/components/FormularioReserva.js` | Calendario, disponibilidad y creación de reserva |
| `app/components/FormularioWaitlist.js` | Contacto e inscripción en lista de espera |
| `app/components/Navbar.js` | Navegación compartida |

No hay pantalla de gestión de pacientes, botón de cancelación en el dashboard ni página `/reset-password/...` a la que apunta el backend. La cancelación pública es un endpoint de Django, no una página Next.js.

## Sesión y consultas

- El login recibe `access` y `refresh`, pero guarda únicamente `access` en `localStorage`, bajo la clave `token`.
- Las consultas privadas envían `Authorization: Bearer <token>`.
- No hay renovación automática; el frontend no usa `/auth/token/refresh/`.
- El dashboard muestra una invitación a iniciar sesión si no consigue el perfil. La autorización de datos depende de la API; no hay protección general de rutas mediante middleware.
- El dashboard muestra campos históricos de la reserva, como `reservation_firstname`.
- Las plantillas numeran los días de `0=lunes` a `6=domingo`.
- La API pagina a 20 elementos. El calendario recorre páginas para identificar días disponibles; los turnos de un día y los listados del panel consumen solo la primera página.

Django decide disponibilidad, generación y persistencia. Aceptar una oferta cancela las reservas futuras confirmadas del mismo paciente con ese profesional antes de crear la nueva.

## Limitaciones que afectan la interfaz

- Crear ausencias o desactivar plantillas no retira automáticamente los turnos existentes.
- Eliminar plantillas puede borrar turnos y reservas por cascada.
- Los correos se imprimen en consola; la cancelación de la reserva apunta al puerto `8000`, aunque la API usa `8001`.
- Las URL locales fijas requieren editar código para cambiar de destino.
- Falta completar manejo de sesión vencida y paginación de los listados mencionados.

El detalle está en el [contexto de arquitectura](../backend/CONTEXTO_ARQUITECTURA.md), archivo local ignorado por Git, y en el README principal.

## Verificación

```powershell
npm run lint
npm run build
```

`npm run start` sirve una compilación ya generada. No hay script de tests automatizados del frontend en `package.json`.

En la revisión del 9 de octubre de 2026, lint fue interrumpido sin resultados; no se verificaron build ni navegación completa. No asumir que esos controles pasaron.

Antes de escribir código en esta carpeta, leé [AGENTS.md](AGENTS.md) y las guías relevantes de la versión instalada de Next.js.
