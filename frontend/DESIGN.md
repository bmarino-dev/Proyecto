# Guía visual fija de ReservaFácil

El prompt de Convix Software aportado por Bruno es la referencia permanente para este diseño, adaptada a una plataforma de reservas para consultorios. Toda modificación queda limitada a presentación, estilos, textos de interfaz y accesibilidad. Los datos, estados, consultas, validaciones y acciones existentes se conservan.

## Dirección visual

Una interfaz clara y serena para odontología, psicología y otras prácticas de salud. Mucho espacio, blanco cálido, salvia y verde petróleo. Evitar fondos oscuros, colores eléctricos, sombras pesadas y movimientos decorativos.

| Uso | Color |
| --- | --- |
| Fondo general | `#f7f8f5` |
| Superficie de tarjetas | `#ffffff` |
| Superficie secundaria | `#edf2ed` |
| Texto principal | `#203b36` |
| Texto secundario | `#5e726c` |
| Bordes | `#dce5df` |
| Acento principal | `#397565` |
| Acento al pasar el puntero | `#285b4f` |
| Acento suave | `#e8f2eb` |
| Lista de espera | `#f0eef6` |
| Error | `#a34040` sobre `#fff0ee` |

## Elementos del prompt que se mantienen

- Marco exterior de 12 px en celular y 16 px en escritorio.
- Hero de altura de pantalla, recortado por un único contenedor con esquinas redondeadas.
- Video original en reproducción automática, sin audio, en bucle y con reproducción integrada. Fondo de reserva y capa clara para asegurar legibilidad.
- Navegación flotante blanca en forma de cápsula. Marca floral de ocho pétalos. Menú desplegable en celular.
- Tipografía Inter para la interfaz e Instrument Serif en cursiva para palabras destacadas.
- Insignia redondeada, título centrado y adaptable, subtítulo breve y botón oscuro con flecha dentro de un círculo.
- Vista previa sobre una bandeja de tono cálido, con tarjetas blancas y cuadrícula de una, dos o tres columnas según el ancho.
- Indicador semicircular de cuarenta marcas como detalle de la vista ilustrativa.
- Recorte de la vista previa en el borde inferior del hero.

## Adaptación a la app

- Mantener la marca ReservaFácil y las rutas de los flujos existentes.
- La vista previa de la portada es ilustrativa y siempre identifica sus datos como ejemplos. Sus controles visuales son estáticos.
- El panel profesional muestra los datos que ya consulta la aplicación, sin nuevas métricas calculadas ni información inventada.
- Acceso y registro usan un bloque editorial salvia y un formulario blanco; en celular se apilan.
- Horarios y ausencias usan encabezados claros, listas blancas y formularios con los mismos controles existentes. Las acciones de borrar son visibles también en pantallas táctiles.
- Reserva pública, lista de espera y aceptación de ofertas comparten tarjetas de perfil, campos, botones y mensajes coherentes.
- Conservar los estados de disponibilidad, selección, carga, error y éxito; cambiar solamente su presentación.
- Respetar preferencia de movimiento reducido, foco visible, asociación de etiquetas y tamaños adaptables.

## Ubicación de los elementos compartidos

- `app/globals.css`: paleta, estilos y adaptación a tamaños de pantalla.
- `app/components/Visuals.js`: marca, iconos y bloque editorial de acceso.
- `app/components/Navbar.js`: navegación compartida.
- `app/components/Hero.js`: composición del hero de inicio y demo.
- `app/components/DashboardPreview.js`: vista ilustrativa del panel.

No agregar dependencias, nuevas llamadas de API ni funciones de negocio para implementar cambios visuales.
