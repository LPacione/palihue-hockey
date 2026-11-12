---
name: Tracker Pro
description: "Pit-Wall Match Operations — a live hockey telemetry console: carbon glass panels, one electric-blue accent reserved for what is live, and monospaced numbers for every reading."
colors:
  carbon-void: "#020617"
  panel-glass: "rgba(15, 23, 42, 0.72)"
  panel-solid: "#0f172a"
  panel-inset: "rgba(2, 6, 23, 0.45)"
  panel-overlay: "rgba(2, 6, 23, 0.72)"
  hairline: "rgba(30, 41, 59, 0.85)"
  hairline-soft: "rgba(51, 65, 85, 0.55)"
  electric-blue: "#2563eb"
  electric-blue-bright: "#3b82f6"
  electric-blue-wash: "rgba(59, 130, 246, 0.14)"
  text-primary: "#f1f5f9"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  signal-beacon: "#93c5fd"
  signal-positive: "#60a5fa"
  signal-negative: "#f87171"
  signal-negative-strong: "#ef4444"
  signal-discipline: "#fbbf24"
  signal-neutral: "#94a3b8"
  signal-transition: "#38bdf8"
  signal-green-card: "#34d399"
  highlight-yellow: "#facc15"
  pitch-night: "#153a72"
  pitch-deep: "#102c5b"
  pitch-abyss: "#0a1e42"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.07em"
  micro:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.07em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  data-small:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
  icon:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  tile: "6px"
  badge: "8px"
  control-sm: "10.4px"
  control: "12px"
  card: "14.4px"
  panel: "16px"
  pill: "9999px"
spacing:
  "2xs": "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
components:
  panel:
    backgroundColor: "{colors.panel-glass}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "12px"
  panel-inset:
    backgroundColor: "{colors.panel-inset}"
    rounded: "{rounded.control}"
    padding: "8px"
  button-primary:
    backgroundColor: "{colors.electric-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "12.8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.electric-blue-bright}"
  button-primary-active:
    backgroundColor: "{colors.electric-blue}"
  button-ghost:
    backgroundColor: "rgba(30, 41, 59, 0.5)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    padding: "8px 11.2px"
  button-danger:
    backgroundColor: "rgba(239, 68, 68, 0.08)"
    textColor: "{colors.signal-negative}"
    rounded: "{rounded.control}"
    padding: "11.2px 16px"
  button-timer:
    backgroundColor: "rgba(30, 41, 59, 0.55)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    padding: "8.8px 13.6px"
  score-button:
    backgroundColor: "rgba(30, 41, 59, 0.6)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    size: "44px"
  chip:
    backgroundColor: "rgba(30, 41, 59, 0.5)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "7.2px 12.8px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.electric-blue}"
    textColor: "#ffffff"
  action-button:
    backgroundColor: "rgba(30, 41, 59, 0.45)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "8px 6px"
    height: "92px"
  action-button-active:
    backgroundColor: "{colors.electric-blue-wash}"
    textColor: "#ffffff"
  player-chip:
    backgroundColor: "rgba(30, 41, 59, 0.45)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    padding: "8px 11.2px"
    height: "44px"
  player-chip-active:
    backgroundColor: "{colors.electric-blue}"
    textColor: "#ffffff"
  bench-chip:
    backgroundColor: "rgba(30, 41, 59, 0.45)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    padding: "8px 11.2px"
    height: "44px"
  zone-button:
    backgroundColor: "rgba(15, 23, 42, 0.6)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    height: "48px"
  main-tab:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-sm}"
    padding: "9.6px 11.2px"
  main-tab-active:
    backgroundColor: "{colors.electric-blue}"
    textColor: "#ffffff"
  action-bar:
    width: "100%"
    padding: "0px 12px 12px"
  live-badge:
    backgroundColor: "{colors.electric-blue-wash}"
    textColor: "{colors.signal-beacon}"
    rounded: "{rounded.badge}"
    padding: "6.4px 8px"
  modal:
    backgroundColor: "{colors.panel-glass}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "20px"
  modal-overlay:
    backgroundColor: "{colors.panel-overlay}"
    width: "100%"
    height: "100%"
  stat-card:
    backgroundColor: "{colors.panel-glass}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "13.6px"
  stat-mini:
    backgroundColor: "{colors.panel-inset}"
    rounded: "{rounded.control-sm}"
    padding: "8px 6px"
  glass-input:
    backgroundColor: "rgba(2, 6, 23, 0.5)"
    textColor: "#ffffff"
    rounded: "{rounded.control-sm}"
    padding: "10.4px 12.8px"
  feed-item:
    backgroundColor: "rgba(2, 6, 23, 0.4)"
    rounded: "12px"
    padding: "10px"
---

# Design System: Tracker Pro

## Overview

**Creative North Star: "The Pit-Wall Match Operations Board"**

Tracker Pro is not a stats app that happens to run during a match; it is a **operations console** that a coach reads at a glance from the bench of a stadium. The visual world is the pit wall at night: carbon-dark glass panels floating over a deep charcoal ground, hairline borders the way instrument housings have them, and one electric-blue accent that only ever lights up when something is *live* — the running clock, the active tab, the selected action, the open period. Everything else is a reading, not a decoration.

The system rejects the field-app green outright. Institutional green was the previous identity and it was cut entirely: there is no teal, no emerald, no purple, no indigo anywhere in the chrome. The only green left in the product is the literal green card of hockey (a physical object in the sport, therefore a literal object color, not a brand color). Because that exception exists, every other hue has to earn its place by meaning: blue is *live and positive*, red is *negative*, amber is *discipline and attention*, sky is *transition and substitution*, slate is *neutral data*.

Density is a feature and a constraint at once: the live view has to fit in `100vh` with **zero vertical scroll**, on a tablet held in one hand under stadium light. That single rule drives most of the geometry — 44px minimum touch targets, 92px action tiles, a two-and-a-half second path from "event happened" to "event recorded". Numbers are always monospaced and always heavy, because a scoreboard is read at distance, not parsed.

**Key Characteristics:**
- Carbon ground (`slate-950`) with translucent glass panels and `slate-800` hairlines — depth from translucency, never from colored glow.
- One accent color, electric blue, reserved for live state and primary actions.
- Every figure in JetBrains Mono; every label in Outfit.
- A single screen, no vertical scroll, in the live view.
- Touch targets sized for fingers in motion: 44px floor, 92px for the action pad.
- The lineup is drawn on the pitch, not checked off in a list.
- Commit actions live in a full-width bottom bar, not inside a column.

## Colors

The palette is a cool neutral stack with a single saturated accent; the rest are quiet functional signals that only appear on data-bearing surfaces.

### Primary
- **Electric Blue** (`{colors.electric-blue}`): the only accent. It marks what is *true right now* — the active top tab, the selected category chip, the selected action tile, the running period selector, the "Registrar" CTA, the live badge in Estadísticas. It is never used as decoration or as a large field of color.
- **Bright Blue** (`{colors.electric-blue-bright}`): the top of the primary button gradient and the live pulse dot. Used only where the surface must read as energized.
- **Blue Wash** (`{colors.electric-blue-wash}`): the selected state of action tiles and schema chips — a translucent fill plus a 1px blue outline, so selection is visible without the control becoming a solid block.

### Secondary
- **Signal Blue 300** (`{colors.signal-beacon}`): "faro" tier — the events that must be impossible to miss in the action pad (Gol, Penalti convertido).
- **Signal Blue 400** (`{colors.signal-positive}`): "atractivo" tier — the positive/attractive event family (Corto a Favor, Tiro al arco, Asistencia, Corner a favor, Quite positivo, Recuperación, Gesto, Interceptación). One step lighter than the accent so the action pad never looks like the accent is selected. It is also the **feed's positive** dot and label: a good event reads blue end to end.
- **Signal Sky** (`{colors.signal-transition}`): substitution and transition events (Salida, Contra) and the *En el banco* / *Al banco* states. Deliberately a different hue family from positive blue so "the lineup changed" reads differently from "we scored". Sky is never a positive.
- **Signal Negative** (`{colors.signal-negative}`): the negative tier (Pérdida, Falta cometida, Quite negativo, Corto en Contra, Tarjeta roja, Penalti fallado). Also the text color of the danger button.
- **Signal Negative Strong** (`{colors.signal-negative-strong}`): the saturated fill used for bars and feed dots, where a light red would wash out against the carbon ground.
- **Signal Discipline** (`{colors.signal-discipline}`): discipline and attention (Falta recibida, Pie, Tarjeta amarilla). Amber, not red: a fault received is not a fault committed.
- **Signal Neutral** (`{colors.signal-neutral}`): events with no polarity (Fuera de arco and similar).
- **Signal Green Card** (`{colors.signal-green-card}`): the single green in the product, reserved for the "Tarjeta verde" action because the color is the literal object in the sport.

### Tertiary
- **Highlight Yellow** (`{colors.highlight-yellow}`): the small icon plates that number the flow ("1. ¿Qué Acción?", "2. ¿Quién?") and the lightning glyph of the action step. Confined to 20px plates and 10px glyphs.

### Neutral
- **Carbon Void** (`{colors.carbon-void}`): the page ground and the app-shell background; also the PWA `theme_color` and `background_color`.
- **Panel Glass** (`{colors.panel-glass}`): the standard panel surface — translucent slate-900, so the radial blue light behind the shell tints it slightly.
- **Panel Solid** (`{colors.panel-solid}`): the opaque variant used for `<select>` dropdown options and any surface that must not show what's behind it.
- **Panel Inset** (`{colors.panel-inset}`): the recessed surface *inside* a panel — counters, mini stat tiles, the zone selector, feed rows. One level of insetting, never two.
- **Panel Overlay** (`{colors.panel-overlay}`): modal scrims and the "selecciona la acción primero" veil.
- **Hairline** (`{colors.hairline}`): the 1px border of every panel and control.
- **Hairline Soft** (`{colors.hairline-soft}`): borders of inset surfaces, one step quieter.
- **Text Primary** (`{colors.text-primary}`): headings, the score, the clock, KPI values.
- **Text Secondary** (`{colors.text-secondary}`): labels, chip text, secondary copy.
- **Text Muted** (`{colors.text-muted}`): empty states, hints, and the least important chrome.

### Named Rules

**The Zero-Green Rule.** There is no green in the chrome — no teal, emerald, purple, or indigo anywhere in the shell, panels, tabs, buttons, chips, or charts. The only green permitted is the literal hockey green card. If a new surface wants color, it must come from the blue/red/amber/sky signal set.

**The Blue Means Live Rule.** Electric blue is a state, not a brand. It appears on the active tab, the active chip, the running clock context, the primary CTA, the *Partido en Curso* stage label, and the live badge — nowhere else. A screen that is blue everywhere is a screen where blue means nothing. Before a match starts, every live signal stays grey: the *Partido* tab is dimmed and dotted, the stage label reads *Sin Iniciar*, and the Estadísticas badge stays off.

**The Signal Color Rule.** A hue may only be used where it carries the event's polarity (positive / negative / discipline / transition / neutral). Decorative colorization of a control that carries no event meaning is out of bounds.

## Typography

**Display Font:** JetBrains Mono (with `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` fallback) — reserved for numbers.
**Body Font:** Outfit (with `system-ui, sans-serif` fallback) — everything that is words.
**Label/Mono Font:** JetBrains Mono for all data; Outfit at heavy weights and wide tracking for all-caps labels.

**Character:** A two-voice system with no overlap. Outfit is geometric, quiet, and fast to parse at small sizes; JetBrains Mono is technical and locked to a grid, so digits never shift width as they tick. The pairing reads as *instrument label* + *readout*, which is exactly what a scoreboard is.

### Hierarchy
- **Display** (mono, 800, `3rem`, line-height 1, tracking `-0.05em`): the score and the stopwatch. The clock scales to `3.75rem` on wide viewports. This is the largest type in the product and nothing competes with it.
- **Headline** (Outfit, 700, `1rem`): modal titles and page titles such as "Estadísticas del Partido".
- **Title** (Outfit, 700, `0.875rem`): panel titles — "¿Qué Acción?", "¿Quién?", "Historial", "Esquema Táctico".
- **Body** (Outfit, 400–500, `0.8rem`): explanatory copy, feed player names, chat bubbles. Keep lines under ~75 characters.
- **Label** (Outfit, 800, `0.6875rem` = 11px, letter-spacing `0.07em`, uppercase): field labels, card titles, KPI captions. Always uppercase — the case *is* the label.
- **Micro** (Outfit, 800, `0.625rem` = 10px, uppercase): non-data micro-labels only — the "PAL"/"RIV" crests, the "SUSTITUCIÓN" badge, the quarter labels. Never a number.
- **Data** (mono, 800, `2rem`, line-height 1): KPI values in the Estadísticas strip.
- **Data Small** (mono, 700, `0.875rem`): feed counters, minute stamps, per-quarter rows, bench and validation counts.

### Named Rules

**The Mono Data Rule.** Every number the user reads as data — score, clock, KPI values, counters, minutes, zone values, ratio — is set in JetBrains Mono. Proportional digits in a live readout are a bug, not a style choice.

**The 11px Floor.** No data text may render below 11px. The 10px micro tier exists for uppercase non-numeric chrome only; the 9px tier that appears on the zone-selector caption is the single exception in the built app and must not be extended to any value-bearing surface.

**The 4.5:1 Rule.** No text ships below 4.5:1 contrast against its actual background. `text-muted` on the carbon ground is the darkest legal text; muted-on-muted is not.

## Layout

The app is a **single-screen shell**: `h-screen w-screen overflow-hidden` on the body, an inner `flex flex-col` column, and a `flex-1 min-h-0 overflow-hidden` main region. Nothing in the live view may scroll the page vertically; scrolling is delegated to individual panels (the action pad, the player grid, the feed) via `overflow-y-auto` with a 7px custom scrollbar.

- **Header (`h-14`, 56px, fixed):** brand plate on the left, a centered rail of four tabs — Configuración, Táctica, Partido, Estadísticas — inside a `slate-950/70` rounded container, and Editar/Deporte ghost buttons on the right. The tab rail is the only navigation; there is no drawer and no page push. Under the brand, the stage label (`#current-stage-label`) names the current section.
- **Live view (Partido):** a score-and-clock strip on top (`shrink-0`), then a 12-column grid for the remainder of the height: **acciones `col-span-5` | jugadoras `col-span-3` | historial `col-span-4`**. Below `1024px` it becomes two columns with the history stacked underneath; below `768px` it is a single column. The grid is `flex-1 min-h-0` so it absorbs whatever height the header leaves. Before a match exists, the tab shows an **empty state** instead of the grid: *Partido no iniciado*, a one-line explanation, and a primary *Ir a Configuración* CTA.
- **Action bar (live view):** the *Registrar* CTA is **not** in the actions column. It is a full-width bar pinned to the bottom of the dashboard: a `shrink-0 px-3 pb-3` wrapper that is a **sibling of the 3-column grid** inside `#partido-content`, holding a `max-w-3xl mx-auto` container with the `btn-save-action` button. The bar crosses the whole width of the dashboard, so *Registrar* is reachable from any column without moving the thumb. The button ships disabled (`opacity-50 pointer-events-none`) and only lights up when both an action and a player are selected.
- **Táctica:** a Konva pitch panel on the left (`max-w-[540px]`, aspect `55/91.4`) and a `320px` control column on the right — schema selector, validation readout, bench, legend — plus the **same bottom action bar** pattern (`shrink-0 px-3 pb-3` → `max-w-3xl mx-auto`) carrying the *Iniciar Partido* CTA (`btn-iniciar-partido`), which stays disabled until the eleven are complete.
- **Configuración:** only two inputs (fecha/torneo and categoría) plus a summary panel with the *Once titular* and *Suplentes* counters. There is no roster checklist here — see Components → Tactical Board.
- **Estadísticas:** a `max-w-6xl` column with a five-KPI strip (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) over a widget grid that stretches to fill the remaining height (`lg:flex-1 lg:auto-rows-fr`), so the dashboard is a wall of panels, not a list.
- **Spacing rhythm:** the system works in Tailwind's 4px base — `gap-1`/`gap-1.5` inside controls, `gap-3` between panels, `p-3` for panel gutters, `p-4`/`p-5` for panel interiors, `p-6`/`p-8` for modals. `12px` is the default gutter of the whole product.

## Elevation & Depth

Depth is **tonal and translucent, not shadowed**. Panels sit on the carbon ground as glass: `rgba(15,23,42,0.72)` with a `14px` backdrop blur, so the faint radial blue light behind the shell shows through the top of the screen and the surfaces feel like lit smoked acrylic rather than cards. Inside a panel, a second level appears as a darker inset (`rgba(2,6,23,0.45)`) with a softer hairline. Shadows exist but they are **always neutral** — every one is a `rgba(2,6,23,…)` or `rgba(0,0,0,…)` drop that reads as the panel floating above the ground, never as a colored aura. There is no glow anywhere in the system.

### Shadow Vocabulary
- **Panel Lift** (`box-shadow: 0 10px 30px rgba(2, 6, 23, 0.45)`): the resting shadow of every `.panel`. It separates the glass from the ground without tinting it. Stat cards (`stat-card`) carry the same glass and blur but no shadow — they sit one level flatter than a panel.
- **Control Lift** (`box-shadow: 0 6px 18px rgba(2, 6, 23, 0.6)`): primary buttons and other raised CTAs.
- **Active Tab Shadow** (`box-shadow: 0 4px 14px rgba(2, 6, 23, 0.55)`): the selected top tab — the shadow tightens as the element becomes a solid blue plate.
- **Chip Shadow** (`box-shadow: 0 3px 10px rgba(2, 6, 23, 0.5)`): selected chips, zone buttons, and selected schema chips.

### Named Rules

**The Neutral Shadow Rule.** Shadows are tinted with the ground color, never with the accent. A blue shadow on a blue button is a glow; this system has no glows.

**The Two-Level Depth Rule.** There are exactly two surface levels: glass panel and inset. A third level of nesting means a new element is competing with the data.

## Shapes

The form language is **soft rectangles on carbon, with pills reserved for selection**. Panels and cards are the most generous radii in the system (`1rem` panel, `0.9rem` stat card), so the chrome reads as machined housings rather than boxes. Controls step down (`0.75rem` for buttons and action tiles, `0.65rem` for chips and zone buttons), and the smallest interactive squares keep a soft `12px` corner (`score-btn`). Fully rounded pills (`9999px`) are used only where the element is a *selection token* — category chips, player chips, the selected-player badge, the substitution badge — because a pill reads as "a thing you can pick up and drop onto a surface".

Borders are **hairlines**: 1px at `rgba(30,41,59,0.85)` for panels and controls, `rgba(51,65,85,0.55)` for insets. A hairline is the system's only decorative line; there are no dividers, rules, or gradients used for separation beyond the surface layers themselves.

Two recurring silhouettes sit outside the CSS: the **feed dot** and the **live dot** are 8px circles (fully round, unlike the 12px score buttons), and the **tactical token** on the Konva pitch is a circle with a radial gradient fill and a soft white ring, sized `14–24px` scaled to the canvas.

## Components

### Buttons
- **Shape:** Generous but not round — `0.75rem` for primary and danger, `0.65rem` for ghost and timer. Full-width when they own a panel row.
- **Primary:** a vertical gradient from `electric-blue-bright` to `electric-blue`, white 700-weight text at `0.85rem`, `1px solid rgba(96,165,250,0.5)` border, `0.8rem/1rem` padding. It is the "commit" control: *Iniciar Partido*, *Registrar*, *Ir a Configuración*.
- **Commit CTAs live in a bottom action bar.** *Registrar* (live view) and *Iniciar Partido* (táctica) are full-width primary buttons inside a `max-w-3xl mx-auto` container wrapped by a `shrink-0 px-3 pb-3` bar that is a sibling of the main grid — never a footer inside a column. A commit action that sits inside one column is unreachable from the other two.
- **Hover / Focus:** hover brightens (`filter: brightness(1.1)`) and lifts `-1px`; active presses to `translateY(0) scale(0.99)`. Global focus is a `2px` `electric-blue-bright` outline at `2px` offset. Disabled drops to `opacity: 0.4`, loses its shadow, and stops accepting pointer events. *Registrar* additionally uses `opacity-50 pointer-events-none` while the selection is incomplete.
- **Ghost:** `rgba(30,41,59,0.5)` fill with a hairline border and secondary text — utility actions (Deporte, Vaciar el once, Añadir suplente). Hover lifts the text to white and the border to a lighter slate.
- **Danger:** a low-alpha red fill with a 40%-opacity red border and red text — used exactly once in the live view, on "Finalizar Partido". Hover fills to 18% and the text goes white.
- **Timer:** a compact slate control for the clock transport (Iniciar / Reiniciar), sized to sit under the stopwatch without competing with it.
- **Score button:** `44×44px` squares with a `12px` radius flanking each score; the icon inside is the only glyph.

### Chips
- **Style:** pill (`9999px`), `44px` minimum height, `0.78rem` 600-weight text on `rgba(30,41,59,0.5)` with a hairline border. Used for the action categories (Ofensiva, Gestos, Pérdidas, Defensiva, Infracciones, Tarjetas, Sustitución) and for schema selection.
- **State:** the active chip fills with `electric-blue` and gains a tight neutral shadow; the unselected chip only changes text and border color on hover.
- **Player chip:** a squarer cousin (`0.65rem` radius, `44px` height) with a truncated single-line name; bench players get a dashed border, which is how "not on the pitch" is communicated without an extra color.

### Cards / Containers
- **Corner Style:** `1rem` for panels, `0.9rem` for stat cards.
- **Background:** `panel-glass` with a `14px` backdrop blur (`12px` for stat cards).
- **Shadow Strategy:** neutral panel lift only — see Elevation & Depth.
- **Border:** 1px `hairline`.
- **Internal Padding:** `12px` (live panels), `16px`/`20px` (configuración and táctica panels), `13.6px` (stat cards), with `0.85rem` inside stat cards and inset tiles at `0.5rem`.

### Inputs / Fields
- **Style:** the `glass-input` is a near-black translucent field (`rgba(2,6,23,0.5)`) with a hairline border and a `0.65rem` radius; dropdown option lists are forced to `panel-solid` so the native menu never shows a translucent row.
- **Focus:** the border shifts to `electric-blue-bright` and a `3px` soft blue ring appears — a ring, not a glow.
- **Error / Disabled:** no error state exists in the built app; invalid input is handled by an alert rather than by restyling the field.

### Navigation
- **Style:** four fixed top tabs inside a bordered rail. Each tab is a `0.8rem` 600-weight label with a glyph; inactive tabs are secondary text on transparent, the active tab is a solid `electric-blue` plate with a neutral shadow and a light-blue hairline.
- **Locked tab:** a section that is not yet available is dimmed to `opacity: 0.55` (class `is-locked`) and marked with a `5px` round dot appended after the label (`::after`, current color at 70% opacity). *Partido* carries this state until a match is started; the dot says "there is something here, but not yet" without adding a second hue.
- **Stage label:** under the brand, `#current-stage-label` names the current section — *Configuración*, *Cancha / Táctica*, *Partido*, *Estadísticas*. In the live tab it reads **"Sin Iniciar"** in muted slate before the match and **"Partido en Curso"** in `text-blue-400` during it. Blue here means one thing only: the match is running.
- **Mobile treatment:** below `md` the tab labels collapse to their glyphs only; the header shrinks its padding and the Editar/Deporte buttons keep their icons.

### Action Tile (signature)
The heart of the live view: a **`92px` tall** column tile, icon over label, `0.75rem` radius, translucent slate fill. The icon carries the semantic hue of the event family; the label stays neutral until the tile is selected. Selected, the tile gets the blue wash fill plus a 1px blue outline, and its label turns white. Below `1024px` the pad reflows to `auto-fill minmax(92px, 1fr)`; at `1024px` and above it locks to three columns so the muscle memory of a tap target never moves between devices.

- **Always a real tile.** `renderActionsGrid` builds a full `.action-btn` (min-height `92px`) for *every* action, including categories that hold a single action — the single-action case renders the same tile and auto-selects it. A category never degrades into an italic sentence: the pad's spatial rhythm must not change with the number of actions.
- **Keyboard-operable.** The tile is a `div` with `role="button"`, `tabindex="0"` and `aria-label="Acción {id}"`; Enter and Space both trigger the selection. The tile is a real target for assistive tech, not a decorative div with a click handler.

### Feed Item (signature)
Each event is a card: an inset surface with a hairline border, the **event in mono uppercase as the dominant line**, the player name demoted to secondary text, and two stamps on the right — the period in a blue micro-badge and the minute in a slate mono badge. A colored 8px dot on the left carries the event's polarity. New rows fade and rise into place.

- **Feed color mapping.** `agregarLogUI` maps the event theme to the dot and label colors: *positive* (`cyan` theme → dot `#60a5fa`, label `text-blue-300`) is **blue**, not sky; *transition* (`sky` → dot `#38bdf8`, label `text-sky-300`) stays **sky** and is reserved for substitution and lineup changes; *negative* is `#ef4444` / `text-red-300`; the literal green card keeps `#34d399` / `text-emerald-300`. Blue reads as "good", sky reads as "the lineup moved".
- **Empty feed.** With zero events the feed shows a centered italic *No hay acciones registradas aún* in `slate-400` — muted, never a blue "0" placeholder.

### Stat Card & KPI
A KPI is a label in uppercase plus a `2rem` mono value. Widget cards carry a title row (uppercase, `0.72rem`, `0.07em` tracking) with a tinted glyph, and hold mini tiles (`stat-mini`) — an uppercase caption over a `1.05rem` mono number on an inset surface. Progress is expressed as thin tracks: `slate-800` rails with a saturated blue/red fill and a `700ms` width transition.

- **Live badge.** `#stats-live-badge` ships **off**: grey plate (`bg-slate-800/60`, `border-slate-700`, `text-slate-400`) with the live dot hidden. It only lights up (blue plate, blue text, pulsing live dot) while a match is in progress. The badge is the second "am I live?" signal after the stage label, and it never lies.
- **Sport-sensitive KPI labels.** Two KPI captions are rewritten at runtime from the active sport: `kpi-perdidas-label` is *Pérdidas* in hockey and *Contras* in fútbol; `kpi-recuperaciones-label` is *Robos* in hockey and *Recuperaciones* in fútbol. The card title *Robos por Zona* follows the same switch.
- **One tone per metric.** *Pérdidas por Zona* uses three `bg-red-500` bars; *Robos por Zona* uses three `bg-blue-500` bars. The color identifies the metric, not the row, so the two cards stay readable as a pair. *Distribución de Salidas* is the one exception — it is a categorical split, so it keeps three distinct tones (`blue-500` / `sky-400` / `slate-400`).
- **Zero data means zero width.** With no records, the ratio bars and the exit-distribution bars stay at **`0%`** — they are not redistributed to fill the rail. A 50/50 blue-red split on an empty match is a false reading; the empty rail is the honest one.

### Tactical Board (signature)
A Konva canvas rendering a night pitch in deep blue (`#153a72 → #102c5b → #0a1e42`) with white line markings and faint grass stripes at 3% white. Player tokens are gradient circles — amber for the goalkeeper, sky for defenders, cyan for midfielders, rose for attackers — each with a white ring, a label, and a soft colored drop. Empty positions are translucent white. Every token carries an invisible hit area 9px larger than its visual radius, and tokens are draggable so a formation can be adjusted by touch. This is the only surface in the product where position is communicated spatially rather than as a list of checkboxes.

- **The board is the single source of truth for the lineup.** There are no checkboxes and no tabbed roster anywhere in the app. Tapping a token opens `#tactical-player-modal`, which lists every player in the category with a state tag: **Actual** (blue), **Ocupa {posición} · intercambiar** (amber), **En el banco · al once** (sky), **Disponible** (slate). Selecting a player who already holds a position swaps the two assignments.
- **Bench panel.** `#bench-grid` holds the substitutes as `.player-chip.bench` chips with a dashed border and a small remove glyph, plus a *Añadir suplente* ghost button that opens `#bench-player-modal` with the players not yet in the eleven or the bench.
- **Clear the eleven.** A *Vaciar el once* ghost button empties every position assignment so the formation can be built by hand; the validation readout then turns amber and the *Iniciar Partido* CTA stays disabled.
- **Compact legend.** The legend under the pitch is a row of `10px` chips (`px-1.5 py-0.5`, `gap-1`), each showing the position label and the assigned player's short name, or *libre* when the slot is empty. The help line *"Tocá una ficha de la cancha para asignar o cambiar la jugadora · arrastrala para ajustar la posición"* sits **above** the chips, separated by a small margin.

### Named Rules

**The Board Is The Roster Rule.** The lineup exists in exactly one place: the Konva pitch. Touch a token, pick a player in the modal; the bench is a chip list, not a second checklist. If a screen needs to show the eleven, it reads the board.

**The Zero-Data Rule.** With no records, bars stay at `0%` and empty states say so in muted text. A bar that redistributes itself to fill the rail, or a KPI that renders as a placeholder, is a false reading — the absence of data must look like absence.

### Modals
Both dialogs (`#tactical-player-modal`, `#bench-player-modal`) are full-screen scrims (`bg-slate-950/80` + blur) holding a glass panel with a `1rem` radius and `1.25rem` padding. Each carries `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at its title; a single global `Escape` keydown listener closes both. Clicking the scrim closes; clicking inside does not.

### Coach IA
A floating blue action button (`48px`, `56px` on larger screens) bottom-right, with a sliding side panel of `400px` that enters from the right. Its bubbles are tinted by speaker — translucent blue for the user, slate for the coach — and a three-dot typing indicator pulses in the accent. The *Historial*, *Nuevo* and close buttons and the suggestion pills are `text-[11px]` with a **`44px` minimum height**, so every chat control is a legal touch target.

## Do's and Don'ts

### Do:
- **Do** reserve electric blue for live state and the primary commit action, so the color keeps meaning "now".
- **Do** set every number in JetBrains Mono at heavy weight, and keep the score and clock as the two largest elements on screen.
- **Do** keep the live view inside `100vh` with no page-level vertical scroll — push overflow into the action pad, the player grid, or the feed, never the shell.
- **Do** hold every touch target to at least `44px` of height (`56px`+ when the layout allows) and keep action tiles at `92px`.
- **Do** express lineup and formation **on the pitch**, positioning tokens by touch and drag, with the bench as chips plus a modal — the board is the source of truth for alignment.
- **Do** tint a control by the polarity of the data it carries (positive, negative, discipline, transition, neutral), using the signal palette — blue for positive, sky for substitution and transition.
- **Do** keep the header at `h-14` with the four tabs always visible, so navigation never costs a scroll or a back gesture.
- **Do** keep text at or above `4.5:1` contrast and never let data fall below `11px`.
- **Do** put the commit CTA in the full-width bottom action bar (`shrink-0 px-3 pb-3` → `max-w-3xl mx-auto`), so it is reachable from every column.
- **Do** render a real tile for every action, even in a single-action category, and keep the tile keyboard-operable with `role`, `tabindex`, `aria-label`, Enter and Space.
- **Do** keep the live signals honest: grey badge, *Sin Iniciar*, and a dimmed *Partido* tab until a match is actually running.
- **Do** let empty states say so in muted text and leave ratio and distribution bars at `0%` when there is nothing to show.

### Don't:
- **Don't** introduce green, teal, emerald, purple, or indigo into the chrome — the only green allowed is the literal green card.
- **Don't** use colored shadows, glows, or neon bloom; every shadow is neutral.
- **Don't** let the live view scroll vertically, and don't let any panel's content push the shell past `100vh`.
- **Don't** add colored gradients, illustrations, or decorative hues to the shell; the only gradient in the product is the primary button and the pitch canvas.
- **Don't** set data in the proportional sans font, and don't animate the score with anything other than the sharp `cubic-bezier(0.16, 1, 0.3, 1)` scale.
- **Don't** build alignment or formation as a list of checkboxes; it is set by placing tokens on the tactical board.
- **Don't** shrink a control below the `44px` floor or drop the label from an action tile to save space.
- **Don't** reuse the semantic signal hues for generic decoration — a red chip that isn't a negative event is a bug.
- **Don't** paint positive feed events sky, or paint the *Pérdidas por Zona* and *Robos por Zona* cards with different tones for the same metric.
- **Don't** light the live badge, the stage label, or the *Partido* tab blue before a match is in progress.
