# Plan de Mejora de la Interfaz Web App - Palihue Hockey Tracker

## 1. Visión General
La web app actual es una sola página (SPA) con Tailwind CSS, vanilla JS y Supabase integración. Proporciona seguimiento de partidos de hockey con cronómetro, marcador, registro de acciones y estadísticas. El objetivo es mejorar la experiencia de usuario (UX), modernizar el diseño y añadir funcionalidades útiles.

## 2. Áreas de Mejora Identificadas

### A. Diseño Visual y Marca
- **Refinar paleta de colores**: El verde oscuro actual (#064e3b) es bueno, pero se pueden añadir gradientes más vibrantes y colores de acento consistentes para acciones (verde para gol, azul para gestos, rojo para pérdidas, etc.)
- **Tipografía**: La fuente Outfit ya está cargada. Considerar pesos más variados para jerarquía clara.
- **Sombras y profundidad**: Los paneles "glassmorphism" están bien, pero se pueden suavizar los bordes y añadir sombra consistente.

### B. Header/Top Bar
- **Rediseño del header**: La barra superior actual es funcional pero compacta. Podría añadir:
  - Indicador de cuarto actual siempre visible
  - Atajos de teclado (mostrados al pasar el mouse)
  - Menú de configuración rápida

### C. Sección de Configuración de Partido (Section Setup)
- **Selector de fecha mejorado**: Actualmente es un `<select>`. Podría convertirse en un calendario visual o picker con scroll.
- **Gestión de categorías**: El selector de categoría funciona, pero al cambiar de categoría, el estado de la alineación se pierde. Podría añadirse un aviso de "alineación no guardada".
- **Alineación visual**: Las listas de titulares/suplentes con casillas checkbox pueden mejorarse con avatares o iniciales de jugadores.

### D. Tablero Principal Durante el Partido (Section Match)
- **Cronómetro y marcador**: Ya es fuerte, pero se podrían añadir:
  - Display de tiempo restante opcional (modo countdown)
  - Botón de "minuto personalizado" para entradas/salidas precisas
- **Cuadro de acciones (Action Dashboard)**:
  - Las categorías de acciones (Gestos, Ofensiva, Defensiva, etc.) podrían tener iconos y colores más distintivos.
  - El grid de acciones debería ser más grande/táctil para uso en tabletas.
- **Panel de jugadores**:
  - Mostrar el nombre y el tiempo que cada jugadora lleva en campo/banco.
  - Resaltar visualmente al jugador seleccionado.
- **Panel de estadísticas lateral**:
  - Las tarjetas de estadísticas (ratio R/P, distribución de salidas, zonas) podrían ser interactivas (al hacer hover, mostrar valores exactos).
  - Añadir un resumen rápido de "Qué pasó este cuarto".

### E. Pestañas de Feed y Estadísticas
- **Historial de acciones (Feed)**:
  - Cada entrada del log podría tener un botón "deshacer" para errores de registro durante el partido.
  - Filtrar el feed por tipo de acción, zona o cuarto.
- **Estadísticas (Insights)**:
  - Añadir gráficas pequeñas (mini-barras) adicionales para distribución por cuarto.
  - Exportar estadísticas a CSV/JSON.
  - Comparación lateral entre los dos cuartos (Q1/Q3 vs Q2/Q4).

### F. Panel del Coach IA (Floating Action Button)
- **Acceso directo**: El FAB actual abre el chat. Podría tener un menú dropdown con prompts rápidos en lugar de ir a la pantalla completa.
- **Historial local**: Ya funciona con localStorage, pero podría sincronizarse con Supabase opcionalmente.

### G. Responsividad y Mobile First
- El diseño actual parece "mobile first" pero algunos elementos no se adaptan bien a pantallas muy pequeñas.
- Probar el flujo completo en mobile: selector de categoría, cronómetro, registro de acciones con los dedos.

### H. Accesibilidad (a11y)
- Añadir atributos `aria-label` a los botones principales.
- Asegurar contraste suficiente (el fondo verde muy oscuro sobre texto blanco puede tener problemas de contraste en algunos casos).
- Mejorar el enfoque del teclado al navegar entre los elementos interactivos.

## 3. Priorización
| Prioridad | Componente | Esfuerzo | Impacto |
|-----------|------------|----------|---------|
| Alta | Mejorar contrasto y accesibilidad | Bajo | Alto |
| Alta | Rediseño del header y indicador de cuarto | Medio | Alto |
| Media | Grid de acciones más táctil | Medio | Medio |
| Media | Feed de acciones interactivo (filtrar/deshacer) | Alto | Alto |
| Baja | Panel Coach IA con menú dropdown | Bajo | Medio |
| Baja | Estadísticas con gráficas visuales | Alto | Medio |

## 4. Próximos Pasos Recomendados
1. Implementar un script de datos mockeados para poblar la base de Supabase (ver sección siguiente).
2. Ejecutar una auditoría de contraste en los colores actuales.
3. Crear un componente de "Action Button" reutilizable con mejores estados hover/active.
4. Añadir `aria-label` a los elementos críticos.
5. Probar el flujo en un dispositivo móvil real.

---
*Plan generado para la web app Palihue Hockey Tracker*