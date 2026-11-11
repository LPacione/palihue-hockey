// sport-config.js - Configuración deportiva para Hockey/Fútbol
// Permite cambiar entre hockey sobre césped y fútbol (soccer)
// manteniendo compatibilidad con la base de datos existente.

// --- CONFIGURACIÓN DE DEPORTES ---
const SPORT_CONFIG = {
  // Modo actual ('hockey' o 'futbol')
  current: 'hockey',

  // --- CONFIGURACIÓN DE HOCKEY (original) ---
  hockey: {
    name: 'Hockey Césped',
    emoji: '⛸️',
    timerFormat: 'countUp', // count up from 0
    quarterTime: 15, // minutos por cuarto
    quarters: 4, // número de cuartos
    periodsLabel: 'Cuartos',
    halfTime: false,
    
    // Acciones disponibles en hockey
    actions: [
      { id: 'Gol', category: 'Ofensiva', color: 'brand', zone: false },
      { id: 'Gesto Bloqueo', category: 'Gestos', color: 'blue', zone: false },
      { id: 'Gesto Flick', category: 'Gestos', color: 'blue', zone: false },
      { id: 'Gesto Salida Linea', category: 'Gestos', color: 'blue', zone: false },
      { id: 'Gesto Salida X', category: 'Gestos', color: 'blue', zone: false },
      { id: 'Gesto Salida al medio', category: 'Gestos', color: 'blue', zone: false },
      { id: 'Pérdida', category: 'Pérdidas', color: 'red', zone: true },
      { id: 'Quite positivo', category: 'Defensiva', color: 'teal', zone: true },
      { id: 'Quite negativo', category: 'Defensiva', color: 'red', zone: true },
      { id: 'Recuperación', category: 'Defensiva', color: 'teal', zone: true },
      { id: 'Falta recibida', category: 'Infracciones', color: 'orange', zone: true },
      { id: 'Falta cometida', category: 'Infracciones', color: 'red', zone: true },
      { id: 'Tarjeta verde', category: 'Tarjetas', color: 'green', zone: false },
      { id: 'Tarjeta amarilla', category: 'Tarjetas', color: 'yellow', zone: false },
      { id: 'Tarjeta roja', category: 'Tarjetas', color: 'red', zone: false },
      { id: 'Corto a Favor', category: 'Ofensiva', color: 'green', zone: false },
      { id: 'Corto en Contra', category: 'Ofensiva', color: 'red', zone: false },
      { id: 'Tiro al arco', category: 'Ofensiva', color: 'green', zone: false },
      { id: 'Salida', category: 'Sustitución', color: 'purple', zone: false }
    ],
    
    // Estadísticas por defecto por jugadora
    defaultStats: {
      tiempo_jugado: 0,
      goles: 0,
      gesto_bloqueo: 0,
      gesto_flick: 0,
      gesto_salida_linea: 0,
      gesto_salida_x: 0,
      gesto_salida_al_medio: 0,
      tarjeta_amarilla: 0,
      tarjeta_roja: 0,
      tarjeta_verde: 0,
      quite_positivo: 0,
      quite_negativo: 0,
      recuperacion: 0,
      falta_recibida: 0,
      corto_a_favor: 0,
      corto_en_contra: 0,
      tiro_al_arco: 0
    }
  },

  // --- CONFIGURACIÓN DE FÚTBOL ---
  futbol: {
    name: 'Fútbol',
    emoji: '⚽',
    timerFormat: 'countUp', // count up from 0 (also can be countdown 45+)
    quarterTime: 45, // minutos por mitad (45 min estándar)
    quarters: 2, // número de mitades (usando quarters para consistencia UI)
    periodsLabel: 'Mitades',
    halfTime: true,
    
    // Acciones disponibles en fútbol
    actions: [
      { id: 'Gol', category: 'Ofensiva', color: 'brand', zone: false },
      { id: 'Asistencia', category: 'Ofensiva', color: 'teal', zone: false },
      { id: 'Tiro al arco', category: 'Ofensiva', color: 'green', zone: false },
      { id: 'Fuera de arco', category: 'Ofensiva', color: 'gray', zone: false },
      { id: 'Tiro libre', category: 'Set-piece', color: 'orange', zone: true },
      { id: 'Corner a favor', category: 'Set-piece', color: 'teal', zone: true },
      { id: 'Corner en contra', category: 'Set-piece', color: 'orange', zone: true },
      { id: 'Falta', category: 'Infracciones', color: 'red', zone: true },
      { id: 'Tarjeta amarilla', category: 'Tarjetas', color: 'yellow', zone: false },
      { id: 'Tarjeta roja', category: 'Tarjetas', color: 'red', zone: false },
      { id: 'Penalti', category: 'Set-piece', color: 'brand', zone: true },
      { id: 'Contra', category: 'Transición', color: 'purple', zone: true },
      { id: 'Balón parado', category: 'Set-piece', color: 'orange', zone: false },
      { id: 'Salida', category: 'Sustitución', color: 'purple', zone: false }
    ],
    
    // Estadísticas por defecto por jugadora (fútbol)
    defaultStats: {
      tiempo_jugado: 0,
      goles: 0,
      asistencias: 0,
      tiro_al_arco: 0,
      tiro_fuera: 0,
      falta_cometida: 0,
      tarjeta_amarilla: 0,
      tarjeta_roja: 0,
      corner_a_favor: 0,
      corner_en_contra: 0,
      penalti_convertido: 0,
      penaltiFallado: 0,
      recuperacion_balon: 0,
      interceptaciones: 0
    }
  }
};

// --- HELPERS ---

/**
 * Cambia el deporte activo
 * @param {string} sport - 'hockey' o 'futbol'
 */
function setSport(sport) {
  if (!SPORT_CONFIG[sport]) {
    console.error(`Deporte "${sport}" no configurado`);
    return false;
  }
  
  SPORT_CONFIG.current = sport;
  
  // Guardar preferencia en localStorage
  try {
    localStorage.setItem('palihue_sport', sport);
  } catch (e) {
    console.error('Error guardando preferencia de deporte:', e);
  }
  
  // Dispatch event para que otros componentes reaccionen
  window.dispatchEvent(new CustomEvent('sportChange', {
    detail: { sport, config: SPORT_CONFIG[sport] },
    bubbles: true,
    cancelable: true
  }));
  
  console.log(`🔄 Modo cambiado a: ${sport}`);
  return true;
}

/**
 * Obtiene la configuración deportiva actual
 * @returns {object} configuración actual
 */
function getCurrentConfig() {
  return SPORT_CONFIG.current ? SPORT_CONFIG[SPORT_CONFIG.current] : null;
}

/**
 * Obtiene todas las acciones disponibles para el deporte actual
 * @returns {array} array de objetos de acción
 */
function getCurrentActions() {
  return getCurrentConfig() ? SPORT_CONFIG[SPORT_CONFIG.current].actions : [];
}

/**
 * Obtiene las estadísticas por defecto para el deporte actual
 * @returns {object} objeto de estadísticas vacío
 */
function getDefaultStats() {
  return getCurrentConfig() ? { ...SPORT_CONFIG[SPORT_CONFIG.current].defaultStats } : null;
}

/**
 * Convierte una acción de hockey a su equivalente en fútbol si existe
 * @param {string} hockeyAction - ID de acción de hockey
 * @returns {string|null} ID de acción de fútbol o null
 */
function hockeyToFutbolAction(hockeyAction) {
  const futbolActions = getCurrentActions().map(a => a.id);
  
  // Mapeo de acciones hockey → fútbol
  const mapping = {
    'Gesto Bloqueo': 'Falta', // bloqueo = falta en fútbol
    'Gesto Flick': 'Tiro al arco', // flick = tiro
    'Gesto Salida Linea': 'Falta', // salida línea = falta
    'Gesto Salida X': 'Falta', // salida X = falta
    'Gesto Salida al medio': 'Balón parado', // salida al medio
    'Pérdida': 'Pérdida', // mismo nombre
    'Quite positivo': 'Interceptaciones', // quite positivo
    'Quite negativo': 'Pérdida', // quite negativo = pérdida
    'Recuperación': 'Recuperación balon', // recuperación
    'Falta recibida': 'Falta', // mismo
    'Falta cometida': 'Falta cometida', // mismo
    'Tarjeta verde': 'Tarjeta amarilla', // verde = amarilla (más suave)
    'Tarjeta amarilla': 'Tarjeta amarilla', // misma
    'Tarjeta roja': 'Tarjeta roja', // misma
    'Corto a Favor': 'Asistencia', // corto a favor = asistencia
    'Corto en Contra': 'Balón parado', // corto en contra
    'Tiro al arco': 'Tiro al arco' // mismo
  };
  
  return mapping[hockeyAction] || null;
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Intentar recuperar deporte guardado
  try {
    const saved = localStorage.getItem('palihue_sport');
    if (saved && SPORT_CONFIG[saved]) {
      setSport(saved);
    }
  } catch (e) {
    // Si falla localStorage, usar hockey por defecto
  }
  
  // Escuchar cambios globales
  window.addEventListener('sportChange', (e) => {
    console.log(`📊 Sport event: ${e.detail.sport}`);
    actualizarInterfazDeporte(e.detail.sport);
  });
});

/**
 * Actualiza la interfaz cuando cambia el deporte
 * @param {string} sport - nuevo deporte
 */
function actualizarInterfazDeporte(sport) {
  // This will be called from the UI switch
  // Updates timeout, action buttons, stats fields, etc.
  const config = SPORT_CONFIG[sport];
  if (!config) return;
  
  console.log(`🎯 Interfaz actualizada para: ${config.name}`);
  
  // Aquí se actualizarían:
  // - Labels de tiempo (45' vs 15' por cuarto)
  // - Categorías de acciones mostradas
  // - Campos de estadísticas en el formulario
  // - Iconos y colores en la UI
}

// Exportar funciones para uso global
window.setSport = setSport;
window.getCurrentConfig = getCurrentConfig;
window.getCurrentActions = getCurrentActions;
window.getDefaultStats = getDefaultStats;
window.hockeyToFutbolAction = hockeyToFutbolAction;
window.SPORT_CONFIG = SPORT_CONFIG;

// Exportar también para módulos ESM
export { SPORT_CONFIG, setSport, getCurrentConfig, getCurrentActions, getDefaultStats, hockeyToFutbolAction };