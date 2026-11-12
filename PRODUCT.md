# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Ayudante de campo / cuerpo técnico del club Palihue.** Usa una tablet en el banco de suplentes o al costado de la cancha, durante el partido en vivo.
- **Entrenador/a.** Consulta el marcador, el cronómetro, el historial de acciones y las estadísticas del partido; interactúa con el Coach IA.
- Situación: eventos que ocurren cada pocos segundos, iluminación de estadio (o solar directa), posible uso con una sola mano, necesidad de no apartar la vista de la cancha.

## Product Purpose

PWA para registrar eventos del partido en vivo (goles, tarjetas, faltas, cambios, gestos, recuperaciones, etc.) y trackear estadísticas. Existe para que el cuerpo técnico registre cada acción de forma fiable en menos de 2 segundos y disponga de un panel de control del partido en una sola pantalla.

## Positioning

Mecanismo diferencial: registro táctil ultrarrápido estilo *Football Manager* (botonera compacta de acceso inmediato) combinado con un dashboard de una sola pantalla sin scroll, pensado para tablet en el banco. No es una app de estadísticas genérica: está hecha para operar en pleno partido.

## Operating Context

- Flujo actual: configuración del partido (fecha, categoría, plantilla, pizarra táctica) → partido en vivo (cronómetro, marcador, acciones, feed, estadísticas) → guardado en Supabase.
- Uso real en tablet, orientación horizontal o vertical.
- Persistencia en Supabase (esquema existente: `resumen_partidos`, `acciones`, `resumen_jugadoras`, `formaciones_partido`, `jugadoras`).
- Datos de prueba: `MOCK_JUGADORAS` en `code.js` como fallback cuando Supabase no tiene datos.

## Capabilities and Constraints

- Funcionalidad que debe preservarse: cronómetro por períodos (cuartos/mitades), marcador propio/rival, registro de acciones con zona y sustituciones, plantilla titulares/suplentes, pizarra táctica 2D con Konva, feed de acciones, panel de estadísticas por zona/período, Coach IA con chat, guardado en Supabase.
- Soporta dos deportes: hockey césped y fútbol (configuración en `CONFIG_DEPORTES` / `TACTICAL_SCHEMAS`).
- PWA con `manifest.json` y `sw.js`; desplegada en Vercel/Netlify.
- Restricción de diseño exigida por el usuario: eliminar por completo el color verde actual; migrar a fondos oscuros slate/carbón (`#0f172a` / `slate-950`) con acentos azules corporativos (`blue-600` / `blue-400`), textos `slate-100`/`slate-400`, glassmorphism sutil (`slate-900/80` + `border-slate-800/80`).
- Restricción de UX exigida: cero scroll vertical en la vista principal; layout en grid de una sola pantalla (100vh/100vw); botones táctiles grandes; pestañas fijas con cambio instantáneo.

## Brand Commitments

- Nombre del producto: **Tracker Pro**. Club: **Palihue**.
- El usuario exige eliminar el verde institucional actual y sustituirlo por la paleta slate/azul descrita arriba.
- Tipografía: marcador y cronómetro en fuente monoespaciada y negritas grandes para legibilidad a distancia; UI en sans limpia.
- El FAB del Coach IA se mantiene como botón flotante con panel lateral deslizante.

## Evidence on Hand

- Datos sintéticos de jugadoras en `MOCK_JUGADORAS` (categorías 7ma/6ta/5ta/1ra femenina y 1ra masculina) para testing.
- No hay testimonios, métricas de usuarios ni activos de marca confirmados. No se deben inventar.

## Product Principles

1. **Registro en menos de 2 segundos:** la botonera y la selección de jugadora deben ser alcanzables con un solo toque, sin scroll ni búsquedas.
2. **Una sola pantalla:** la información cabe en el viewport; el scroll vertical queda prohibido en la vista principal.
3. **Legibilidad a distancia:** números grandes, mono, alto contraste; etiquetas cortas y jerarquía clara.
4. **No apartar la vista de la cancha:** navegación por pestañas fijas y estados siempre visibles; el feedback de cada acción es inmediato.
5. **Preservar la funcionalidad existente:** el rediseño es visual y de layout; la lógica, el esquema de datos y los flujos siguen igual.

## Accessibility & Inclusion

- Áreas táctiles amplias (mínimo 44px, idealmente 56px+) para uso con dedos en movimiento.
- Contraste alto entre texto y fondo (objetivo WCAG AA).
- Estados claros para botones (default, hover, activo, deshabilitado, foco).
