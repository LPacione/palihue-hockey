// code.js - Lógica Principal e Integración con Supabase
// --- VARIABLES GLOBALES ---
import Konva from 'konva';

let supabaseClient = null;
let categoriaActual = "";
let fechaActual = "";
let cuartoActual = "Q1"; // Q1, Q2, Q3, Q4

let jugadorasData = []; // Todas las jugadoras de la DB p/ la categoria
let titulares = []; // Nombres
let suplentes = []; // Nombres
let playerStatus = {}; // { "Nombre": "In_Field" | "On_Bench" }

let timerInterval;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;
let countdownMode = false; // We keep false to count UP from 0

let golesPropios = 0;
let golesRival = 0;

let accionesRegistradas = []; // Row history objects
let estadisticasJuego = {}; // Acumulador p/ el final del partido
let tiempoJugado = {};
let tiempoEntrada = {};

let selectedPlayer = null;
let selectedSubstitute = null;
let selectedZone = null;

// --- NAVEGACIÓN PRINCIPAL (dashboard a una pantalla, pestañas fijas) ---
let matchStarted = false;

// --- PIZARRA TÁCTICA (Konva.js) ---
let tacticalStage = null;
let tacticalLayer = null;
let tacticalFieldGroup = null;
let tacticalPositions = {}; // { positionId: { x, y, playerName, group, circle, text } }
let selectedTacticalPosition = null; // positionId actualmente seleccionado en modal
let currentSchema = null; // Esquema actual seleccionado
let tacticalTokenNodes = []; // Nodos Konva de las fichas (para limpiarlos al redibujar)
let suplentesBench = []; // Jugadoras en el banco (seleccionadas desde la pizarra táctica)

// --- DEPORTE Y CONFIGURACIÓN (inicializado en DOMContentLoaded) ---
let deporteActual = 'hockey'; // Default: hockey

// Configuración de deportes - definida después de cargar el DOM
const CONFIG_DEPORTES = {
  hockey: {
    nombre: 'Hockey Césped',
    emoji: '⛸️',
    timerCount: 'up', // count up from 0
    minutosPorPeriodo: 15,
    numeroPeriodos: 4,
    labelPeriodos: 'Cuartos',
    labelPeriodo: 'cuarto',
    periodos: [
      { id: 'Q1', label: 'Q1' },
      { id: 'Q2', label: 'Q2' },
      { id: 'Q3', label: 'Q3' },
      { id: 'Q4', label: 'Q4' }
    ],
    esMitad: false,
    acciones: [
      { id: 'Gol', categoria: 'Ofensiva', color: 'brand', zona: false, icon: 'fa-futbol' },
      { id: 'Gesto Bloqueo', categoria: 'Gestos', color: 'blue', zona: false, icon: 'fa-shield-alt' },
      { id: 'Gesto Flick', categoria: 'Gestos', color: 'blue', zona: false, icon: 'fa-hand-point-up' },
      { id: 'Gesto Salida Linea', categoria: 'Gestos', color: 'blue', zona: false, icon: 'fa-ruler-horizontal' },
      { id: 'Gesto Salida X', categoria: 'Gestos', color: 'blue', zona: false, icon: 'fa-times-circle' },
      { id: 'Gesto Salida al medio', categoria: 'Gestos', color: 'blue', zona: false, icon: 'fa-arrows-alt-h' },
      { id: 'Pérdida', categoria: 'Pérdidas', color: 'red', zona: true, icon: 'fa-arrow-down' },
      { id: 'Quite positivo', categoria: 'Defensiva', color: 'cyan', zona: true, icon: 'fa-hand-rock' },
      { id: 'Quite negativo', categoria: 'Defensiva', color: 'red', zona: true, icon: 'fa-hand-paper' },
      { id: 'Recuperación', categoria: 'Defensiva', color: 'cyan', zona: true, icon: 'fa-redo-alt' },
      { id: 'Falta recibida', categoria: 'Infracciones', color: 'orange', zona: true, icon: 'fa-handshake' },
      { id: 'Falta cometida', categoria: 'Infracciones', color: 'red', zona: true, icon: 'fa-exclamation-triangle' },
      { id: 'Pie', categoria: 'Infracciones', color: 'orange', zona: true, icon: 'fa-shoe-prints' },
      { id: 'Tarjeta verde', categoria: 'Tarjetas', color: 'green', zona: false, icon: 'fa-square', solid: true },
      { id: 'Tarjeta amarilla', categoria: 'Tarjetas', color: 'yellow', zona: false, icon: 'fa-square', solid: true },
      { id: 'Tarjeta roja', categoria: 'Tarjetas', color: 'red', zona: false, icon: 'fa-square', solid: true },
      { id: 'Corto a Favor', categoria: 'Ofensiva', color: 'cyan', zona: false, icon: 'fa-plus-circle' },
      { id: 'Corto en Contra', categoria: 'Ofensiva', color: 'red', zona: false, icon: 'fa-minus-circle' },
      { id: 'Tiro al arco', categoria: 'Ofensiva', color: 'cyan', zona: false, icon: 'fa-bullseye' },
      { id: 'Salida', categoria: 'Sustitución', color: 'sky', zona: false, icon: 'fa-exchange-alt' }
    ],
    estadisticasPorDefecto: {
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
  futbol: {
    nombre: 'Fútbol',
    emoji: '⚽',
    timerCount: 'up', // count up from 0 (also can be countdown 45+)
    minutosPorPeriodo: 45,
    numeroPeriodos: 2,
    labelPeriodos: 'Mitades',
    labelPeriodo: 'tiempo',
    periodos: [
      { id: '1T', label: '1T' },
      { id: '2T', label: '2T' }
    ],
    esMitad: true,
    acciones: [
      { id: 'Gol', categoria: 'Ofensiva', color: 'brand', zona: false, icon: 'fa-futbol' },
      { id: 'Asistencia', categoria: 'Ofensiva', color: 'cyan', zona: false, icon: 'fa-hands-helping' },
      { id: 'Tiro al arco', categoria: 'Ofensiva', color: 'cyan', zona: false, icon: 'fa-bullseye' },
      { id: 'Fuera de arco', categoria: 'Ofensiva', color: 'gray', zona: false, icon: 'fa-arrow-up' },
      { id: 'Falta', categoria: 'Infracciones', color: 'red', zona: true, icon: 'fa-exclamation-triangle' },
      { id: 'Tarjeta amarilla', categoria: 'Tarjetas', color: 'yellow', zona: false, icon: 'fa-square', solid: true },
      { id: 'Tarjeta roja', categoria: 'Tarjetas', color: 'red', zona: false, icon: 'fa-square', solid: true },
      { id: 'Penalti convertido', categoria: 'Set-piece', color: 'brand', zona: false, icon: 'fa-bullseye' },
      { id: 'Penalti fallado', categoria: 'Set-piece', color: 'red', zona: false, icon: 'fa-times-circle' },
      { id: 'Corner a favor', categoria: 'Set-piece', color: 'cyan', zona: false, icon: 'fa-flag' },
      { id: 'Corner en contra', categoria: 'Set-piece', color: 'orange', zona: false, icon: 'fa-flag' },
      { id: 'Contra', categoria: 'Transición', color: 'sky', zona: true, icon: 'fa-bolt' },
      { id: 'Recuperación', categoria: 'Transición', color: 'cyan', zona: true, icon: 'fa-redo-alt' },
      { id: 'Interceptación', categoria: 'Transición', color: 'blue', zona: true, icon: 'fa-hand-paper' },
      { id: 'Balón parado', categoria: 'Set-piece', color: 'orange', zona: false, icon: 'fa-stopwatch' },
      { id: 'Salida', categoria: 'Sustitución', color: 'sky', zona: false, icon: 'fa-exchange-alt' }
    ],
    estadisticasPorDefecto: {
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
 
 // --- ESQUEMAS TÁCTICOS POR DEPORTE ---
 // Coordenadas en porcentaje (0-100) relativas al canvas
 // x: 0 = izquierda, 100 = derecha | y: 0 = arriba (portería propia), 100 = abajo (portería rival)
const TACTICAL_SCHEMAS = {
  hockey: {
    '3-3-3-1': {
      nombre: '3-3-3-1 (Clásico)',
      descripcion: '3 defensas, 3 medios, 3 delanteros, 1 punta',
      positions: [
        { id: 'GK', label: 'ARQ', x: 50, y: 8, role: 'Arquero' },
        { id: 'DEF_C', label: 'DC', x: 50, y: 22, role: 'Defensa Central' },
        { id: 'DEF_L', label: 'DI', x: 20, y: 22, role: 'Defensa Izquierdo' },
        { id: 'DEF_R', label: 'DD', x: 80, y: 22, role: 'Defensa Derecho' },
        { id: 'MED_C', label: 'MC', x: 50, y: 40, role: 'Medio Centro' },
        { id: 'MED_L', label: 'MI', x: 20, y: 40, role: 'Medio Izquierdo' },
        { id: 'MED_R', label: 'MD', x: 80, y: 40, role: 'Medio Derecho' },
        { id: 'DEL_C', label: 'DC', x: 50, y: 60, role: 'Delantero Centro' },
        { id: 'DEL_L', label: 'DI', x: 25, y: 60, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 75, y: 60, role: 'Delantero Derecho' },
        { id: 'PUNTA', label: 'PT', x: 50, y: 82, role: 'Punta / Extremo' }
      ]
    },
    '4-3-2-1': {
      nombre: '4-3-2-1 (Defensivo)',
      descripcion: '4 defensas, 3 medios, 2 delanteros, 1 punta',
      positions: [
        { id: 'GK', label: 'ARQ', x: 50, y: 8, role: 'Arquero' },
        { id: 'DEF_CL', label: 'DCI', x: 35, y: 20, role: 'Defensa Central Izq' },
        { id: 'DEF_CR', label: 'DCD', x: 65, y: 20, role: 'Defensa Central Der' },
        { id: 'DEF_L', label: 'LI', x: 12, y: 28, role: 'Lateral Izquierdo' },
        { id: 'DEF_R', label: 'LD', x: 88, y: 28, role: 'Lateral Derecho' },
        { id: 'MED_CL', label: 'MCI', x: 30, y: 42, role: 'Medio Centro Izq' },
        { id: 'MED_C', label: 'MC', x: 50, y: 42, role: 'Medio Centro' },
        { id: 'MED_CR', label: 'MCD', x: 70, y: 42, role: 'Medio Centro Der' },
        { id: 'DEL_L', label: 'DI', x: 30, y: 62, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 70, y: 62, role: 'Delantero Derecho' },
        { id: 'PUNTA', label: 'PT', x: 50, y: 80, role: 'Punta' }
      ]
    },
    '3-4-3': {
      nombre: '3-4-3 (Ofensivo)',
      descripcion: '3 defensas, 4 medios, 3 delanteros',
      positions: [
        { id: 'GK', label: 'ARQ', x: 50, y: 8, role: 'Arquero' },
        { id: 'DEF_C', label: 'DC', x: 50, y: 20, role: 'Defensa Central' },
        { id: 'DEF_L', label: 'DI', x: 20, y: 20, role: 'Defensa Izquierdo' },
        { id: 'DEF_R', label: 'DD', x: 80, y: 20, role: 'Defensa Derecho' },
        { id: 'MED_CL', label: 'MCI', x: 30, y: 38, role: 'Medio Centro Izq' },
        { id: 'MED_CR', label: 'MCD', x: 70, y: 38, role: 'Medio Centro Der' },
        { id: 'MED_L', label: 'MI', x: 15, y: 50, role: 'Medio Izquierdo' },
        { id: 'MED_R', label: 'MD', x: 85, y: 50, role: 'Medio Derecho' },
        { id: 'DEL_C', label: 'DC', x: 50, y: 65, role: 'Delantero Centro' },
        { id: 'DEL_L', label: 'DI', x: 25, y: 65, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 75, y: 65, role: 'Delantero Derecho' }
      ]
    },
    '5-3-2': {
      nombre: '5-3-2 (Contragolpe)',
      descripcion: '5 defensas, 3 medios, 2 delanteros',
      positions: [
        { id: 'GK', label: 'ARQ', x: 50, y: 6, role: 'Arquero' },
        { id: 'DEF_CL', label: 'DCI', x: 30, y: 18, role: 'Def. Central Izq' },
        { id: 'DEF_C', label: 'DC', x: 50, y: 16, role: 'Defensa Central' },
        { id: 'DEF_CR', label: 'DCD', x: 70, y: 18, role: 'Def. Central Der' },
        { id: 'DEF_L', label: 'LI', x: 8, y: 28, role: 'Lateral Izquierdo' },
        { id: 'DEF_R', label: 'LD', x: 92, y: 28, role: 'Lateral Derecho' },
        { id: 'MED_L', label: 'MI', x: 25, y: 45, role: 'Medio Izquierdo' },
        { id: 'MED_C', label: 'MC', x: 50, y: 45, role: 'Medio Centro' },
        { id: 'MED_R', label: 'MD', x: 75, y: 45, role: 'Medio Derecho' },
        { id: 'DEL_L', label: 'DI', x: 35, y: 68, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 65, y: 68, role: 'Delantero Derecho' }
      ]
    }
  },
  futbol: {
    '4-4-2': {
      nombre: '4-4-2 (Clásico)',
      descripcion: '4 defensas, 4 medios, 2 delanteros',
      positions: [
        { id: 'GK', label: 'POR', x: 50, y: 6, role: 'Portero' },
        { id: 'DEF_L', label: 'LI', x: 10, y: 22, role: 'Lateral Izquierdo' },
        { id: 'DEF_CL', label: 'DCI', x: 30, y: 18, role: 'Defensa Central Izq' },
        { id: 'DEF_CR', label: 'DCD', x: 70, y: 18, role: 'Defensa Central Der' },
        { id: 'DEF_R', label: 'LD', x: 90, y: 22, role: 'Lateral Derecho' },
        { id: 'MED_L', label: 'MI', x: 10, y: 45, role: 'Medio Izquierdo' },
        { id: 'MED_CL', label: 'MCI', x: 35, y: 45, role: 'Medio Centro Izq' },
        { id: 'MED_CR', label: 'MCD', x: 65, y: 45, role: 'Medio Centro Der' },
        { id: 'MED_R', label: 'MD', x: 90, y: 45, role: 'Medio Derecho' },
        { id: 'DEL_L', label: 'DI', x: 35, y: 75, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 65, y: 75, role: 'Delantero Derecho' }
      ]
    },
    '4-3-3': {
      nombre: '4-3-3 (Ofensivo)',
      descripcion: '4 defensas, 3 medios, 3 delanteros',
      positions: [
        { id: 'GK', label: 'POR', x: 50, y: 6, role: 'Portero' },
        { id: 'DEF_L', label: 'LI', x: 10, y: 22, role: 'Lateral Izquierdo' },
        { id: 'DEF_CL', label: 'DCI', x: 30, y: 18, role: 'Defensa Central Izq' },
        { id: 'DEF_CR', label: 'DCD', x: 70, y: 18, role: 'Defensa Central Der' },
        { id: 'DEF_R', label: 'LD', x: 90, y: 22, role: 'Lateral Derecho' },
        { id: 'MED_CL', label: 'MCI', x: 30, y: 42, role: 'Medio Centro Izq' },
        { id: 'MED_C', label: 'MC', x: 50, y: 42, role: 'Medio Centro (Pivote)' },
        { id: 'MED_CR', label: 'MCD', x: 70, y: 42, role: 'Medio Centro Der' },
        { id: 'DEL_L', label: 'EI', x: 15, y: 70, role: 'Extremo Izquierdo' },
        { id: 'DEL_C', label: 'DC', x: 50, y: 72, role: 'Delantero Centro' },
        { id: 'DEL_R', label: 'ED', x: 85, y: 70, role: 'Extremo Derecho' }
      ]
    },
    '3-5-2': {
      nombre: '3-5-2 (Control)',
      descripcion: '3 defensas, 5 medios, 2 delanteros',
      positions: [
        { id: 'GK', label: 'POR', x: 50, y: 6, role: 'Portero' },
        { id: 'DEF_CL', label: 'DCI', x: 30, y: 18, role: 'Defensa Central Izq' },
        { id: 'DEF_C', label: 'DC', x: 50, y: 16, role: 'Defensa Central' },
        { id: 'DEF_CR', label: 'DCD', x: 70, y: 18, role: 'Defensa Central Der' },
        { id: 'MED_L', label: 'CI', x: 12, y: 40, role: 'Carrilero Izquierdo' },
        { id: 'MED_CL', label: 'MCI', x: 30, y: 42, role: 'Medio Centro Izq' },
        { id: 'MED_C', label: 'MC', x: 50, y: 42, role: 'Medio Centro' },
        { id: 'MED_CR', label: 'MCD', x: 70, y: 42, role: 'Medio Centro Der' },
        { id: 'MED_R', label: 'CD', x: 88, y: 40, role: 'Carrilero Derecho' },
        { id: 'DEL_L', label: 'DI', x: 35, y: 72, role: 'Delantero Izquierdo' },
        { id: 'DEL_R', label: 'DD', x: 65, y: 72, role: 'Delantero Derecho' }
      ]
    },
    '4-2-3-1': {
      nombre: '4-2-3-1 (Equilibrado)',
      descripcion: '4 defensas, 2 pivotes, 3 mediapuntas, 1 delantero',
      positions: [
        { id: 'GK', label: 'POR', x: 50, y: 6, role: 'Portero' },
        { id: 'DEF_L', label: 'LI', x: 10, y: 22, role: 'Lateral Izquierdo' },
        { id: 'DEF_CL', label: 'DCI', x: 30, y: 18, role: 'Defensa Central Izq' },
        { id: 'DEF_CR', label: 'DCD', x: 70, y: 18, role: 'Defensa Central Der' },
        { id: 'DEF_R', label: 'LD', x: 90, y: 22, role: 'Lateral Derecho' },
        { id: 'MED_CL', label: 'PI', x: 35, y: 40, role: 'Pivote Izquierdo' },
        { id: 'MED_CR', label: 'PD', x: 65, y: 40, role: 'Pivote Derecho' },
        { id: 'MED_L', label: 'MI', x: 15, y: 55, role: 'Mediapunta Izq' },
        { id: 'MED_C', label: 'MP', x: 50, y: 52, role: 'Mediapunta Central' },
        { id: 'MED_R', label: 'MD', x: 85, y: 55, role: 'Mediapunta Der' },
        { id: 'DEL_C', label: 'DC', x: 50, y: 75, role: 'Delantero Centro' }
      ]
    }
  }
};

 // --- MOCK DATA: Jugadoras por categoría (para testing sin Supabase) ---
const MOCK_JUGADORAS = {
  '7ma_fem': [
    { nombre: 'Laura García' },
    { nombre: 'María López' },
    { nombre: 'Sofía Martínez' },
    { nombre: 'Valentina Rodríguez' },
    { nombre: 'Paula Gómez' },
    { nombre: 'Lucía Fernández' },
    { nombre: 'Carla Sánchez' },
    { nombre: 'Andrea Torres' },
    { nombre: 'Julia Martín' },
    { nombre: 'Paula Ruiz' },
    { nombre: 'Marta Jiménez' },
    { nombre: 'Sara Herrera' }
  ],
  '6ta_fem': [
    { nombre: 'Carmen Díaz' },
    { nombre: 'Patricia Ramírez' },
    { nombre: 'Beatriz Serrano' },
    { nombre: 'Elena Pérez' },
    { nombre: 'Natalia Cruz' },
    { nombre: 'Irene Gil' },
    { nombre: 'Aitana Bueno' },
    { nombre: 'Claudia Morales' },
    { nombre: 'Sandra Ortiz' },
    { nombre: 'Rocío Delgado' },
    { nombre: 'Verónica Castro' },
    { nombre: 'Miriam Suárez' }
  ],
  '5ta_fem': [
    { nombre: 'Sara Jiménez' },
    { nombre: 'Diego López' },
    { nombre: 'Marina Torres' },
    { nombre: 'Nerea Ruiz' },
    { nombre: 'Aroa Sánchez' },
    { nombre: 'Claudia Navarro' },
    { nombre: 'Iria Gil' },
    { nombre: 'Daniela Gómez' },
    { nombre: 'Alba Vázquez' },
    { nombre: 'Paula Moreno' },
    { nombre: 'Laura Molina' },
    { nombre: 'Irene Serrano' }
  ],
  '1ra_fem': [
    { nombre: 'Carla Herrera' },
    { nombre: 'Valeria Romero' },
    { nombre: 'Beatriz Castro' },
    { nombre: 'Laura Alonso' },
    { nombre: 'Sofía Navarro' },
    { nombre: 'Andrea Díaz' },
    { nombre: 'Jimena Suárez' },
    { nombre: 'Paloma Molina' },
    { nombre: 'Marta Iglesias' },
    { nombre: 'Paula Blanco' },
    { nombre: 'Sara Rubio' },
    { nombre: 'Lucía Ortiz' }
  ],
  '1ra_masc': [
    { nombre: 'Diego Álvarez' },
    { nombre: 'Lucas Fernández' },
    { nombre: 'Martín García' },
    { nombre: 'Santiago Rodríguez' },
    { nombre: 'Tomás López' },
    { nombre: 'Pablo Pérez' },
    { nombre: 'Andrés Martín' },
    { nombre: 'Javier Jiménez' },
    { nombre: 'Adrián Ruiz' },
    { nombre: 'Carlos Serrano' },
    { nombre: 'Miguel Torres' },
    { nombre: 'David Vázquez' }
  ]
};

// Función para obtener configuración actual
function obtenerConfigDeporte() {
  return CONFIG_DEPORTES[deporteActual] || CONFIG_DEPORTES.hockey;
}

// Función para obtener acciones disponibles
function obtenerAccionesDeporte() {
  return obtenerConfigDeporte().acciones;
}

// Función para obtener estadísticas por defecto
function obtenerEstadisticasPorDefecto() {
  return obtenerConfigDeporte().estadisticasPorDefecto;
}

// --- PERÍODOS (cuartos / mitades) DINÁMICOS SEGÚN EL DEPORTE ---
function obtenerPeriodosDeporte() {
  const cfg = obtenerConfigDeporte();
  if (Array.isArray(cfg.periodos) && cfg.periodos.length > 0) {
    return cfg.periodos;
  }
  // Fallback para configuraciones antiguas
  const total = cfg.numeroPeriodos || 4;
  return Array.from({ length: total }, (_, i) => ({
    id: `Q${i + 1}`,
    label: `Q${i + 1}`
  }));
}

function getPeriodoLabel(periodoId) {
  const p = obtenerPeriodosDeporte().find(x => x.id === periodoId);
  return p ? p.label : periodoId;
}

function getDuracionPeriodoMs() {
  return (obtenerConfigDeporte().minutosPorPeriodo || 15) * 60 * 1000;
}

function getTotalMinutosPartido() {
  const cfg = obtenerConfigDeporte();
  return (cfg.minutosPorPeriodo || 15) * (cfg.numeroPeriodos || 4);
}

// Pinta los botones de período (Q1..Q4 / 1T..2T) según el deporte activo
function renderPeriodSelector() {
  const selector = document.getElementById('quarter-selector');
  if (!selector) return;

  const cfg = obtenerConfigDeporte();
  const periodos = obtenerPeriodosDeporte();

  if (!periodos.some(p => p.id === cuartoActual)) {
    cuartoActual = periodos[0].id;
  }

  selector.innerHTML = periodos.map(p => {
    const active = p.id === cuartoActual;
    const base = 'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all';
    const cls = active
      ? `${base} bg-blue-600 text-white shadow-md shadow-blue-600/30`
      : `${base} text-slate-400 hover:text-white`;
    return `<button type="button" onclick="setQuarter('${p.id}')" data-q="${p.id}" class="${cls}">${p.label}</button>`;
  }).join('');

  const label = document.getElementById('period-selector-label');
  if (label) label.innerText = cfg.labelPeriodos;

  const duration = document.getElementById('period-duration-label');
  if (duration) {
    duration.innerText = `${cfg.minutosPorPeriodo}' por ${cfg.labelPeriodo} · ${cfg.numeroPeriodos} ${cfg.labelPeriodos.toLowerCase()}`;
  }

  renderPeriodLabels();
}

// Títulos/labels de estadísticas que dependen del deporte
function renderPeriodLabels() {
  const cfg = obtenerConfigDeporte();

  const title = document.getElementById('period-comparison-title');
  if (title) {
    title.innerHTML = `<i class="fas fa-columns text-blue-400"></i> Comparativa ${cfg.labelPeriodos}`;
  }

  const esFutbol = deporteActual === 'futbol';

  const statLabel = document.getElementById('period-stat-label');
  if (statLabel) {
    statLabel.innerText = esFutbol ? 'CÓRNERS' : 'CORTOS';
  }

  const thirdLabel = document.getElementById('period-third-label');
  if (thirdLabel) {
    thirdLabel.innerText = esFutbol ? 'TIROS' : 'PÉRD.';
  }

  const recoveryTitle = document.getElementById('zones-recovery-title');
  if (recoveryTitle) {
    recoveryTitle.innerText = esFutbol ? 'Recuperaciones por Zona' : 'Robos por Zona';
  }

  renderKpiLabels();

  aplicarVisibilidadPorDeporte();
}

// Muestra/oculta bloques exclusivos de un deporte (data-sport-only="hockey" | "futbol")
function aplicarVisibilidadPorDeporte() {
  document.querySelectorAll('[data-sport-only]').forEach(el => {
    const solo = el.getAttribute('data-sport-only');
    if (solo) el.classList.toggle('hidden', solo !== deporteActual);
  });
}

// Función para seleccionar deporte (llamado desde el HTML)
function selectSport(sport) {
  // Debug output
  console.log('🔄 selectSport called with sport:', sport);
  console.log('CONFIG_DEPORTES exists:', !!CONFIG_DEPORTES);
  console.log('CONFIG_DEPORTES[sport]:', CONFIG_DEPORTES[sport]);
  
  if (!CONFIG_DEPORTES[sport]) {
    console.error(`Deporte "${sport}" no válido`, CONFIG_DEPORTES);
    alert('Deporte no configurado. Por favor, recarga la página.');
    return false;
  }
  
  deporteActual = sport;
  
  // Guardar en localStorage para persistencia
  try {
    localStorage.setItem('palihue_deporte', deporteActual);
    localStorage.setItem('palihue_deporte_explicita', 'true');
    console.log('✅ Deporte guardado en localStorage:', deporteActual);
  } catch (e) {
    console.error('Error guardando preferencia de deporte:', e);
    alert('Error guardando tu elección. Por favor, permite el almacenamiento local.');
    return false;
  }
  
  // Dispatch event para que otros componentes reaccionen
  try {
    const event = new CustomEvent('deporteChange', {
      detail: { deporte: deporteActual, config: CONFIG_DEPORTES[deporteActual] },
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
    console.log('📡 Evento deporteChange.dispatched');
  } catch (e) {
    console.error('Error dispatching deporteChange event:', e);
  }
  
  console.log(`🔄 Modo cambiado a: ${CONFIG_DEPORTES[deporteActual].nombre}`);
  
  // Ocultar selector de deporte
  const selector = document.getElementById('sport-selector');
  if (selector) {
    console.log('�iding sport selector');
    selector.classList.add('hidden');
    selector.classList.remove('flex');
    console.log('✅ Sport selector hidden');
  } else {
    console.warn('⚠️ No se encontró el elemento sport-selector');
  }
  
  // Reiniciar la aplicación para el nuevo deporte
  console.log('🔄 Recargando página en 500ms...');
  setTimeout(() => {
    console.log('🔄 Recargando página...');
    window.location.reload();
  }, 500);
  
  return true;
}

// Función para cambiar deporte (desde header)
function cambiarDeporte() {
  // Limpiar preferencias y recargar para mostrar selector
  localStorage.removeItem('palihue_deporte');
  localStorage.removeItem('palihue_deporte_explicita');
  console.log('🔄 Cambiando deporte - limpiando preferencias');
  window.location.reload();
}

// Cambia la sección principal del dashboard (Configuración | Táctica | Partido | Estadísticas)
function switchMainTab(tab) {
  const panels = {
    config: 'tab-config',
    tactica: 'tab-tactica',
    partido: 'tab-partido',
    stats: 'tab-stats'
  };
  const panel = panels[tab];
  if (!panel) return;

  Object.values(panels).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', id !== panel);
  });

  document.querySelectorAll('.main-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  // Estado del partido en vivo: bloqueado hasta iniciar
  const empty = document.getElementById('partido-empty');
  const content = document.getElementById('partido-content');
  if (empty && content) {
    empty.classList.toggle('hidden', matchStarted);
    content.classList.toggle('hidden', !matchStarted);
    content.classList.toggle('flex', matchStarted);
  }

  // La pestaña "Partido" se marca como bloqueada mientras no hay partido en curso
  const partidoTab = document.querySelector('.main-tab[data-tab="partido"]');
  if (partidoTab) {
    partidoTab.classList.toggle('is-locked', !matchStarted);
    partidoTab.title = matchStarted ? 'Partido en vivo' : 'Todavía no hay un partido en curso';
  }

  // La insignia "EN VIVO" de Estadísticas solo se enciende con partido en curso
  const liveBadge = document.getElementById('stats-live-badge');
  if (liveBadge) {
    liveBadge.classList.toggle('bg-blue-600/15', matchStarted);
    liveBadge.classList.toggle('border-blue-500/30', matchStarted);
    liveBadge.classList.toggle('text-blue-300', matchStarted);
    liveBadge.classList.toggle('bg-slate-800/60', !matchStarted);
    liveBadge.classList.toggle('border-slate-700', !matchStarted);
    liveBadge.classList.toggle('text-slate-400', !matchStarted);
    liveBadge.querySelector('.live-dot')?.classList.toggle('hidden', !matchStarted);
  }

  // Etapa actual en la barra superior
  const stage = document.getElementById('current-stage-label');
  if (stage) {
    const labels = {
      config: 'Configuración',
      tactica: 'Cancha / Táctica',
      partido: matchStarted ? 'Partido en Curso' : 'Sin Iniciar',
      stats: 'Estadísticas'
    };
    stage.innerText = labels[tab] || '';
    // El azul queda reservado a "lo vivo": sin partido en curso, la etapa es neutra.
    const enCurso = tab === 'partido' && matchStarted;
    stage.classList.toggle('text-blue-400', enCurso);
    stage.classList.toggle('text-slate-400', !enCurso);
  }

  if (tab === 'tactica') {
    // La cancha estaba oculta: recalcular tamaño y redibujar
    setTimeout(() => {
      ensureTacticalStage();
      resizeTacticalBoard();
    }, 40);
  }
  if (tab === 'stats') {
    actualizarEstadisticas();
  }
}

// ============================================================
// PIZARRA TÁCTICA 2D (KONVA.JS)
// ============================================================

let tacticalResizeObserver = null;
let tacticalResizeRaf = null;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function getSchemasDeporte() {
  return TACTICAL_SCHEMAS[deporteActual] || TACTICAL_SCHEMAS.hockey;
}

function getInitials(nombre) {
  const parts = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getShortName(nombre) {
  const parts = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

function tacticalAssignedCount() {
  const names = Object.values(tacticalPositions)
    .map(p => p.playerName)
    .filter(Boolean);
  return new Set(names).size;
}

function tacticalTotalSlots() {
  return Object.keys(tacticalPositions).length;
}

function tacticalReady() {
  const total = tacticalTotalSlots();
  return total > 0 && tacticalAssignedCount() === total;
}

// Inicializa / refresca la pizarra cuando se carga la plantilla
// Relación de aspecto real de la cancha según el deporte
// Fútbol: 68 x 100 | Hockey: 55 x 91,4
function applyTacticalAspectRatio() {
  const container = document.getElementById('tactical-board-container');
  if (!container) return;
  container.style.aspectRatio = deporteActual === 'futbol' ? '68 / 100' : '55 / 91.4';
}

function initTacticalBoard({ resetAssignments = false } = {}) {
  const section = document.getElementById('tactical-board-section');
  if (!section) return;

  applyTacticalAspectRatio();
  section.classList.remove('opacity-50', 'pointer-events-none');

  const schemas = getSchemasDeporte();
  const ids = Object.keys(schemas);
  if (!currentSchema || !schemas[currentSchema]) {
    currentSchema = ids[0] || null;
  }
  if (!currentSchema) return;

  if (resetAssignments) {
    tacticalPositions = {};
  }

  selectTacticalSchema(currentSchema);
  actualizarContadoresSeleccion();
}

function renderTacticalSchemaSelector() {
  const wrap = document.getElementById('tactical-schema-selector');
  if (!wrap) return;
  const schemas = getSchemasDeporte();

  wrap.innerHTML = Object.entries(schemas).map(([id, schema]) => {
    const active = id === currentSchema;
    const cls = active ? 'schema-chip active' : 'schema-chip';
    return `<button type="button" onclick="selectTacticalSchema('${id}')" class="${cls}">${escapeHtml(schema.nombre)}</button>`;
  }).join('');
}

function selectTacticalSchema(schemaId) {
  const schemas = getSchemasDeporte();
  const schema = schemas[schemaId];
  if (!schema) return;

  const prev = tacticalPositions;
  currentSchema = schemaId;
  tacticalPositions = {};

  schema.positions.forEach(def => {
    const old = prev[def.id];
    tacticalPositions[def.id] = {
      ...def,
      xPct: old ? old.xPct : def.x,
      yPct: old ? old.yPct : def.y,
      playerName: old ? old.playerName : null
    };
  });

  fillEmptyTacticalPositions();
  renderTacticalSchemaSelector();

  const hint = document.getElementById('schema-hint');
  if (hint) {
    hint.innerText = `${schema.descripcion}. Arrastra las fichas y toca una para asignar jugadora.`;
  }

  ensureTacticalStage();
  drawTacticalBoard();
  updateTacticalValidation();
}

// Completa huecos con jugadoras de la plantilla que todavía no están en el banco
function fillEmptyTacticalPositions() {
  const assigned = new Set(
    Object.values(tacticalPositions).map(p => p.playerName).filter(Boolean)
  );
  const enBanco = new Set(suplentesBench);
  const pool = jugadorasData
    .map(j => j.nombre)
    .filter(nombre => nombre && !enBanco.has(nombre));

  Object.values(tacticalPositions).forEach(pos => {
    if (pos.playerName) return;
    const candidate = pool.find(nombre => !assigned.has(nombre));
    if (candidate) {
      pos.playerName = candidate;
      assigned.add(candidate);
    }
  });
}

// --- Konva: stage responsive ---
function ensureTacticalStage() {
  const container = document.getElementById('tactical-board-container');
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  const width = Math.max(220, Math.round(rect.width || 320));
  const height = Math.max(220, Math.round(rect.height || width * 100 / 68));

  if (!tacticalStage) {
    tacticalStage = new Konva.Stage({ container, width, height });
    tacticalLayer = new Konva.Layer();
    tacticalStage.add(tacticalLayer);

    if (typeof ResizeObserver !== 'undefined' && !tacticalResizeObserver) {
      tacticalResizeObserver = new ResizeObserver(() => {
        if (tacticalResizeRaf) cancelAnimationFrame(tacticalResizeRaf);
        tacticalResizeRaf = requestAnimationFrame(() => resizeTacticalBoard());
      });
      tacticalResizeObserver.observe(container);
    }
  } else {
    tacticalStage.width(width);
    tacticalStage.height(height);
  }

  return tacticalStage;
}

function resizeTacticalBoard() {
  if (!tacticalStage) return;
  const container = document.getElementById('tactical-board-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const width = Math.max(220, Math.round(rect.width));
  const height = Math.max(220, Math.round(rect.height));
  if (!width || !height) return;

  if (tacticalStage.width() !== width || tacticalStage.height() !== height) {
    tacticalStage.width(width);
    tacticalStage.height(height);
    drawTacticalBoard();
  }
}

function drawTacticalBoard() {
  if (!tacticalStage || !tacticalLayer) return;
  const w = tacticalStage.width();
  const h = tacticalStage.height();

  drawTacticalField(w, h);
  renderTacticalTokens(w, h);
  renderTacticalLegend();
  tacticalLayer.batchDraw();
}

// --- Konva: cancha ---
function drawTacticalField(w, h) {
  if (!tacticalLayer) return;

  if (tacticalFieldGroup) tacticalFieldGroup.destroy();
  tacticalFieldGroup = new Konva.Group({ listening: false });
  tacticalLayer.add(tacticalFieldGroup);
  tacticalFieldGroup.moveToBottom();

  const isFutbol = deporteActual === 'futbol';
  const g = tacticalFieldGroup;
  const lineColor = isFutbol ? 'rgba(147,197,253,0.58)' : 'rgba(147,197,253,0.74)';
  const softLine = isFutbol ? 'rgba(147,197,253,0.32)' : 'rgba(147,197,253,0.44)';
  const lw = Math.max(1.5, w * 0.0045);
  const pad = Math.max(8, w * 0.032);

  // Fondo con gradiente (cancha nocturna: azul profundo, sin verde)
  g.add(new Konva.Rect({
    x: 0, y: 0, width: w, height: h,
    cornerRadius: 14,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 0, y: h },
    fillLinearGradientColorStops: isFutbol
      ? [0, '#16294a', 0.5, '#112140', 1, '#0a1830']
      : [0, '#153a72', 0.5, '#102c5b', 1, '#0a1e42']
  }));

  // Franjas sutiles de césped
  const stripes = 8;
  for (let i = 0; i < stripes; i += 2) {
    g.add(new Konva.Rect({
      x: 0,
      y: (h / stripes) * i,
      width: w,
      height: h / stripes,
      fill: 'rgba(255,255,255,0.03)'
    }));
  }

  const fieldW = w - pad * 2;
  const fieldH = h - pad * 2;

  if (isFutbol) {
    drawFootballMarkings(g, w, h, fieldW, fieldH, pad, lineColor, softLine, lw);
  } else {
    drawHockeyMarkings(g, w, h, fieldW, fieldH, pad, lineColor, softLine, lw);
  }
}

// Cancha de fútbol: círculo central, áreas y córners
function drawFootballMarkings(g, w, h, fieldW, fieldH, pad, lineColor, softLine, lw) {
  // Límites
  g.add(new Konva.Rect({
    x: pad, y: pad, width: fieldW, height: fieldH,
    stroke: lineColor, strokeWidth: lw, cornerRadius: 2
  }));

  // Línea del medio
  g.add(new Konva.Line({
    points: [pad, h / 2, w - pad, h / 2],
    stroke: lineColor, strokeWidth: lw
  }));

  // Círculo central
  const centerR = fieldW * 0.115;
  g.add(new Konva.Circle({
    x: w / 2, y: h / 2, radius: centerR,
    stroke: lineColor, strokeWidth: lw
  }));
  g.add(new Konva.Circle({
    x: w / 2, y: h / 2, radius: Math.max(2, lw * 1.2),
    fill: lineColor
  }));

  const areaW = fieldW * 0.58;
  const areaH = fieldH * 0.155;
  const goalAreaW = fieldW * 0.30;
  const goalAreaH = fieldH * 0.055;
  const goalW = fieldW * 0.12;
  const goalH = Math.max(4, fieldH * 0.012);

  // Áreas (arriba y abajo)
  [0, 1].forEach(side => {
    const topY = side === 0 ? pad : h - pad - areaH;
    g.add(new Konva.Rect({
      x: w / 2 - areaW / 2,
      y: topY,
      width: areaW,
      height: areaH,
      stroke: lineColor,
      strokeWidth: lw
    }));

    const smallY = side === 0 ? pad : h - pad - goalAreaH;
    g.add(new Konva.Rect({
      x: w / 2 - goalAreaW / 2,
      y: smallY,
      width: goalAreaW,
      height: goalAreaH,
      stroke: softLine,
      strokeWidth: lw
    }));

    // Punto de penal
    const spotY = side === 0 ? pad + areaH * 0.68 : h - pad - areaH * 0.68;
    g.add(new Konva.Circle({
      x: w / 2, y: spotY, radius: Math.max(2, lw * 1.1), fill: softLine
    }));

    // Arco del área grande: bulle hacia el mediocampo
    const boxY = side === 0 ? pad + areaH : h - pad - areaH;
    const start = side === 0 ? 0 : Math.PI;
    const end = side === 0 ? Math.PI : Math.PI * 2;
    g.add(new Konva.Shape({
      x: w / 2,
      y: boxY,
      stroke: lineColor,
      strokeWidth: lw,
      fillEnabled: false,
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        ctx.arc(0, 0, areaW * 0.16, start, end, false);
        ctx.strokeShape(shape);
      }
    }));

    // Arco (portería)
    g.add(new Konva.Rect({
      x: w / 2 - goalW / 2,
      y: side === 0 ? pad - goalH : h - pad,
      width: goalW,
      height: goalH,
      fill: 'rgba(147, 197, 253, 0.18)',
      stroke: lineColor,
      strokeWidth: lw
    }));
  });

  // Puntos de córner
  const cornerR = Math.max(4, fieldW * 0.012);
  [[pad, pad, 0], [w - pad, pad, 90], [pad, h - pad, 270], [w - pad, h - pad, 180]].forEach(([x, y, rotation]) => {
    g.add(new Konva.Arc({
      x, y, innerRadius: 0, outerRadius: cornerR,
      angle: 90, rotation, fill: softLine
    }));
  });
}

// Cancha de hockey: 91,4 x 55 m, líneas de 23 m y círculos de golpeo en D
function drawHockeyMarkings(g, w, h, fieldW, fieldH, pad, lineColor, softLine, lw) {
  const cx = w / 2;
  const topY = pad;
  const bottomY = h - pad;

  // Escala real: 55 m de ancho x 91,4 m de largo
  const MX = fieldW / 55;
  const MY = fieldH / 91.4;

  const goalW = 3.66 * MX;
  const goalDepth = Math.max(4, 1.2 * MY);
  const postL = cx - goalW / 2;
  const postR = cx + goalW / 2;

  const circleRX = 14.63 * MX;
  const circleRY = 14.63 * MY;
  const dashedRX = (14.63 + 5) * MX;
  const dashedRY = (14.63 + 5) * MY;

  // Límites
  g.add(new Konva.Rect({
    x: pad, y: pad, width: fieldW, height: fieldH,
    stroke: lineColor, strokeWidth: lw, cornerRadius: 2
  }));

  // Línea del medio
  g.add(new Konva.Line({
    points: [pad, h / 2, w - pad, h / 2],
    stroke: lineColor, strokeWidth: lw
  }));

  // Punto central
  g.add(new Konva.Circle({
    x: cx, y: h / 2, radius: Math.max(1.8, lw * 1.1), fill: lineColor
  }));

  // Líneas de 23 m
  const line23 = 22.9 * MY;
  [topY + line23, bottomY - line23].forEach(y => {
    g.add(new Konva.Line({
      points: [pad, y, w - pad, y],
      stroke: lineColor, strokeWidth: lw
    }));
  });

  const tick = Math.max(2, 0.55 * MY);

  // Marcas de 5 m y 10 m desde cada poste (córner corto)
  [topY, bottomY].forEach(y0 => {
    [postL, postR].forEach(postX => {
      const dir = postX < cx ? -1 : 1;
      [5, 10].forEach(d => {
        const x = postX + dir * d * MX;
        g.add(new Konva.Line({
          points: [x, y0, x, y0 + (y0 === topY ? tick : -tick)],
          stroke: softLine, strokeWidth: Math.max(1, lw * 0.8)
        }));
      });
    });
  });

  // Marcas en las bandas a 5 m y 14,63 m de cada línea de fondo
  [5, 14.63].forEach(d => {
    [topY + d * MY, bottomY - d * MY].forEach(y => {
      g.add(new Konva.Line({
        points: [pad, y, pad + tick, y],
        stroke: softLine, strokeWidth: Math.max(1, lw * 0.8)
      }));
      g.add(new Konva.Line({
        points: [w - pad, y, w - pad - tick, y],
        stroke: softLine, strokeWidth: Math.max(1, lw * 0.8)
      }));
    });
  });

  // Círculos de golpeo (D) y arco discontinuo a 5 m
  [0, 1].forEach(side => {
    const y0 = side === 0 ? topY : bottomY;
    const inward = side === 0 ? 1 : -1;

    g.add(new Konva.Shape({
      stroke: lineColor,
      strokeWidth: lw,
      fillEnabled: false,
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        if (side === 0) {
          // Fondo superior: de la banda izquierda al frente y de ahí a la derecha
          ctx.ellipse(postL, y0, circleRX, circleRY, 0, Math.PI, Math.PI / 2, true);
          ctx.lineTo(postR, y0 + circleRY);
          ctx.ellipse(postR, y0, circleRX, circleRY, 0, Math.PI / 2, 0, true);
        } else {
          ctx.ellipse(postL, y0, circleRX, circleRY, 0, Math.PI, Math.PI * 1.5, false);
          ctx.lineTo(postR, y0 - circleRY);
          ctx.ellipse(postR, y0, circleRX, circleRY, 0, Math.PI * 1.5, Math.PI * 2, false);
        }
        ctx.strokeShape(shape);
      }
    }));

    // Punto de penal a 6,4 m del fondo
    g.add(new Konva.Circle({
      x: cx,
      y: y0 + inward * 6.4 * MY,
      radius: Math.max(2, lw * 1.25),
      fill: lineColor
    }));

    // Arco discontinuo 5 m por fuera del D
    const dash = Math.max(3, lw * 2.4);
    g.add(new Konva.Shape({
      stroke: softLine,
      strokeWidth: Math.max(1, lw * 0.85),
      dash: [dash, dash],
      fillEnabled: false,
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        if (side === 0) {
          ctx.ellipse(postL, y0, dashedRX, dashedRY, 0, Math.PI, Math.PI / 2, true);
          ctx.lineTo(postR, y0 + dashedRY);
          ctx.ellipse(postR, y0, dashedRX, dashedRY, 0, Math.PI / 2, 0, true);
        } else {
          ctx.ellipse(postL, y0, dashedRX, dashedRY, 0, Math.PI, Math.PI * 1.5, false);
          ctx.lineTo(postR, y0 - dashedRY);
          ctx.ellipse(postR, y0, dashedRX, dashedRY, 0, Math.PI * 1.5, Math.PI * 2, false);
        }
        ctx.strokeShape(shape);
      }
    }));

    // Arco (portería) de 3,66 m de ancho
    g.add(new Konva.Rect({
      x: postL,
      y: side === 0 ? pad - goalDepth : h - pad,
      width: goalW,
      height: goalDepth,
      fill: 'rgba(147, 197, 253, 0.22)',
      stroke: lineColor,
      strokeWidth: lw
    }));
  });
}

// --- Konva: fichas de jugadoras ---
function tacticalRoleColors(pos) {
  if (pos.id === 'GK') return ['#fbbf24', '#b45309'];
  if (pos.id.startsWith('DEF')) return ['#38bdf8', '#0369a1'];
  if (pos.id.startsWith('MED')) return ['#22d3ee', '#0e7490'];
  return ['#fb7185', '#be123c'];
}

function renderTacticalTokens(w, h) {
  // Limpiar TODOS los nodos anteriores (aunque el estado haya cambiado de esquema)
  tacticalTokenNodes.forEach(node => node.destroy());
  tacticalTokenNodes = [];
  Object.values(tacticalPositions).forEach(pos => { pos.group = null; });

  const radius = Math.max(14, Math.min(24, w * 0.052));
  const fontSize = Math.max(9, radius * 0.62);

  Object.values(tacticalPositions).forEach(pos => {
    const cx = (pos.xPct / 100) * w;
    const cy = (pos.yPct / 100) * h;
    const assigned = !!pos.playerName;
    const [c1, c2] = tacticalRoleColors(pos);

    const group = new Konva.Group({
      x: cx, y: cy,
      draggable: true,
      name: 'tactical-token'
    });
    group._dragMoved = false;

    // Área táctil ampliada (accesibilidad móvil, no visible)
    group.add(new Konva.Circle({
      radius: radius + 9,
      fill: 'rgba(0,0,0,0.001)'
    }));

    // Sombra
    group.add(new Konva.Circle({
      x: 1, y: radius * 0.18, radius: radius + 1,
      fill: 'rgba(2, 6, 23, 0.45)', listening: false
    }));

    // Ficha
    const circle = new Konva.Circle({
      radius,
      fillLinearGradientStartPoint: { x: 0, y: -radius },
      fillLinearGradientEndPoint: { x: 0, y: radius },
      fillLinearGradientColorStops: assigned
        ? [0, c1, 1, c2]
        : [0, 'rgba(241, 245, 249, 0.22)', 1, 'rgba(241, 245, 249, 0.08)'],
      stroke: assigned ? 'rgba(241, 245, 249, 0.85)' : 'rgba(241, 245, 249, 0.5)',
      strokeWidth: Math.max(1.5, radius * 0.085),
      shadowColor: assigned ? c2 : '#000000',
      shadowBlur: assigned ? 14 : 0,
      shadowOpacity: 0.55
    });
    group.add(circle);

    // Iniciales / etiqueta de puesto
    group.add(new Konva.Text({
      x: -radius,
      y: -fontSize * 0.55,
      width: radius * 2,
      align: 'center',
      text: assigned ? getInitials(pos.playerName) : pos.label,
      fontSize: assigned ? fontSize : Math.max(8, fontSize * 0.9),
      fontStyle: 'bold',
      fontFamily: 'Outfit, system-ui, sans-serif',
      fill: '#f1f5f9',
      shadowColor: '#000000',
      shadowBlur: 3,
      shadowOpacity: 0.65,
      listening: false
    }));

    // Nombre debajo
    group.add(new Konva.Text({
      x: -radius * 1.75,
      y: radius + Math.max(3, radius * 0.18),
      width: radius * 3.5,
      align: 'center',
      text: assigned ? getShortName(pos.playerName) : 'Libre',
      fontSize: Math.max(7, radius * 0.42),
      fontStyle: assigned ? 'bold' : 'normal',
      fontFamily: 'Outfit, system-ui, sans-serif',
      fill: assigned ? '#eff6ff' : 'rgba(241, 245, 249, 0.5)',
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowOpacity: 0.9,
      listening: false
    }));

    // Etiqueta del puesto encima
    group.add(new Konva.Text({
      x: -radius,
      y: -radius - Math.max(9, radius * 0.5),
      width: radius * 2,
      align: 'center',
      text: pos.label,
      fontSize: Math.max(7, radius * 0.4),
      fontStyle: 'bold',
      fontFamily: 'Outfit, system-ui, sans-serif',
      fill: 'rgba(241, 245, 249, 0.75)',
      shadowColor: '#000000',
      shadowBlur: 3,
      shadowOpacity: 0.8,
      listening: false
    }));

    // Cursor
    group.on('mouseenter', () => {
      if (tacticalStage) tacticalStage.container().style.cursor = 'pointer';
    });
    group.on('mouseleave', () => {
      if (tacticalStage) tacticalStage.container().style.cursor = 'default';
    });

    group.on('dragstart', () => {
      group._dragMoved = false;
      group.moveToTop();
    });
    group.on('dragmove', () => {
      group._dragMoved = true;
    });
    group.on('dragend', () => {
      const stageW = tacticalStage.width();
      const stageH = tacticalStage.height();
      const nx = Math.min(100, Math.max(0, (group.x() / stageW) * 100));
      const ny = Math.min(100, Math.max(0, (group.y() / stageH) * 100));
      pos.xPct = Math.round(nx * 10) / 10;
      pos.yPct = Math.round(ny * 10) / 10;
      group.position({ x: (pos.xPct / 100) * stageW, y: (pos.yPct / 100) * stageH });
      tacticalLayer.batchDraw();
    });

    group.on('click tap', (e) => {
      e.cancelBubble = true;
      if (group._dragMoved) {
        group._dragMoved = false;
        return;
      }
      openTacticalPlayerModal(pos.id);
    });

    tacticalLayer.add(group);
    pos.group = group;
    tacticalTokenNodes.push(group);
  });
}

function renderTacticalLegend() {
  const legend = document.getElementById('position-legend');
  if (!legend) return;

  legend.innerHTML = Object.values(tacticalPositions).map(pos => {
    const assigned = !!pos.playerName;
    const cls = assigned
      ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
      : 'border-slate-700 bg-slate-800/40 text-slate-400';
    return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${cls} text-[10px] font-medium">
      <span class="font-bold">${escapeHtml(pos.label)}</span>
      <span class="opacity-80">${assigned ? escapeHtml(getShortName(pos.playerName)) : 'libre'}</span>
    </span>`;
  }).join('');
}

// --- Validación y sincronización con el roster ---
function updateTacticalValidation() {
  const panel = document.getElementById('tactical-validation');
  if (!panel) return;

  const total = tacticalTotalSlots();
  const count = tacticalAssignedCount();
  const dot = document.getElementById('validation-green');
  const text = document.getElementById('validation-text');
  const countEl = document.getElementById('validation-count');

  panel.classList.remove('hidden');
  if (countEl) countEl.innerText = `${count}/${total || 11}`;

  if (total > 0 && count === total) {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-blue-500';
    if (text) {
      text.className = 'text-xs font-medium text-blue-300';
      text.innerText = `Esquema completo: ${count}/${total} posiciones asignadas`;
    }
  } else {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
    if (text) {
      text.className = 'text-xs font-medium text-amber-300';
      text.innerText = `Faltan ${Math.max(0, total - count)} posiciones por asignar (toca una ficha)`;
    }
  }

  const btn = document.getElementById('btn-iniciar-partido');
  if (btn) btn.disabled = !tacticalReady();
}

// --- Modal de selección de jugadora ---
function openTacticalPlayerModal(positionId) {
  const pos = tacticalPositions[positionId];
  if (!pos) return;

  selectedTacticalPosition = positionId;

  const title = document.getElementById('modal-position-title');
  const desc = document.getElementById('modal-position-desc');
  const list = document.getElementById('modal-player-list');

  if (title) title.innerHTML = `<i class="fas fa-user-plus mr-2 text-blue-400"></i> ${escapeHtml(pos.role || pos.id)}`;
  if (desc) desc.innerText = `Esquema ${currentSchema} · ${pos.label} — elige una jugadora para esta posición`;

  if (list) {
    list.innerHTML = '';

    if (jugadorasData.length === 0) {
      list.innerHTML = '<p class="text-sm text-slate-400 italic text-center py-4">No hay jugadoras cargadas. Selecciona una categoría primero.</p>';
    }

    const assignedElsewhere = new Map();
    Object.values(tacticalPositions).forEach(p => {
      if (p.playerName) assignedElsewhere.set(p.playerName, p.id);
    });
    const enBanco = new Set(suplentesBench);

    jugadorasData.forEach(j => {
      const nombre = j.nombre;
      const isCurrent = pos.playerName === nombre;
      const otherId = assignedElsewhere.get(nombre);
      const isTaken = otherId && otherId !== positionId;
      const isBench = !isCurrent && !isTaken && enBanco.has(nombre);
      const otherPos = isTaken ? tacticalPositions[otherId] : null;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = isTaken
        ? 'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 transition-colors'
        : isCurrent
          ? 'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-500/60 bg-blue-500/20 text-white'
          : isBench
            ? 'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 transition-colors'
            : 'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors';
      btn.innerHTML = `<span class="text-sm font-medium">${escapeHtml(nombre)}</span>
        <span class="text-[11px] uppercase tracking-wider ${isCurrent ? 'text-blue-300' : isTaken ? 'text-amber-300' : isBench ? 'text-sky-300' : 'text-slate-400'}">
          ${isCurrent ? 'Actual' : isTaken ? `Ocupa ${escapeHtml(otherPos.label)} · intercambiar` : isBench ? 'En el banco · al once' : 'Disponible'}
        </span>`;
      btn.onclick = () => assignTacticalPlayer(positionId, nombre);
      list.appendChild(btn);
    });
  }

  const modal = document.getElementById('tactical-player-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeTacticalPlayerModal() {
  const modal = document.getElementById('tactical-player-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  selectedTacticalPosition = null;
}

function assignTacticalPlayer(positionId, nombre) {
  const pos = tacticalPositions[positionId];
  if (!pos) return;

  // Si la jugadora ya ocupa otra posición, intercambiamos ambas
  let previousPlayer = pos.playerName;
  Object.values(tacticalPositions).forEach(p => {
    if (p.id !== positionId && p.playerName === nombre) {
      p.playerName = previousPlayer || null;
    }
  });

  pos.playerName = nombre;

  // Al pasar al once, deja de estar en el banco
  suplentesBench = suplentesBench.filter(n => n !== nombre);

  closeTacticalPlayerModal();
  renderBancoSuplentes();
  drawTacticalBoard();
  updateTacticalValidation();
  actualizarContadoresSeleccion();
}

function clearTacticalPosition() {
  if (!selectedTacticalPosition) return;
  const pos = tacticalPositions[selectedTacticalPosition];
  if (pos) pos.playerName = null;
  closeTacticalPlayerModal();
  renderBancoSuplentes();
  drawTacticalBoard();
  updateTacticalValidation();
  actualizarContadoresSeleccion();
}

// --- Persistencia de la formación en Supabase ---
async function persistirFormacion() {
  if (!supabaseClient) return { skipped: true, reason: 'sin-supabase' };

  const rows = Object.values(tacticalPositions)
    .filter(p => p.playerName)
    .map(p => ({
      partido_fecha: fechaActual,
      categoria: categoriaActual,
      deporte: deporteActual,
      esquema_tactico: currentSchema,
      posicion_id: p.id,
      jugadora_nombre: p.playerName,
      posicion_x_pct: Number((p.xPct ?? 0).toFixed(2)),
      posicion_y_pct: Number((p.yPct ?? 0).toFixed(2))
    }));

  if (rows.length === 0) return { skipped: true, reason: 'sin-jugadoras' };

  // Evitar duplicados si se vuelve a guardar el mismo partido
  const { error: delError } = await supabaseClient
    .from('formaciones_partido')
    .delete()
    .eq('partido_fecha', fechaActual)
    .eq('categoria', categoriaActual)
    .eq('deporte', deporteActual);

  if (delError) {
    console.warn('No se pudo limpiar la formación previa:', delError.message);
  }

  const { error } = await supabaseClient.from('formaciones_partido').insert(rows);
  if (error) throw error;

  console.log(`📋 Formación guardada: ${rows.length} posiciones (${currentSchema})`);
  return { saved: rows.length };
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Aplicar configuración deportiva
  // Verificar si ya hay un deporte guardado EXPLÍCITAMENTE por el usuario
  const deporteGuardado = localStorage.getItem('palihue_deporte');
  const eleccionExplicita = localStorage.getItem('palihue_deporte_explicita');
  
  if (deporteGuardado && CONFIG_DEPORTES[deporteGuardado] && eleccionExplicita === 'true') {
    deporteActual = deporteGuardado;
    console.log('📋 Cargando deporte guardado:', deporteActual);
  } else {
    // Primera vez o sin elección explícita: mostrar selector
    console.log('📱 Primera carga o sin elección explícita - mostrando selector');
  }
  
  // Aplicar la configuración
  const config = CONFIG_DEPORTES[deporteActual];

  // Ajustar proporciones de la cancha al deporte
  applyTacticalAspectRatio();

  // Inicializar período según el deporte (Q1 para hockey, 1T para fútbol)
  cuartoActual = (config.periodos && config.periodos[0] && config.periodos[0].id) || 'Q1';
  renderPeriodSelector();
  renderPeriodLabels();
  updateStopwatchDisplay();
  
  // Mostrar/ocultar selector de deporte
  const selector = document.getElementById('sport-selector');
  if (selector) {
    if (eleccionExplicita === 'true' && deporteGuardado) {
      // Usuario ya eligió explícitamente, ocultar selector
      selector.classList.add('hidden');
      selector.classList.remove('flex');
      console.log('🔄 Selector ocultado (elección explícita:', deporteGuardado + ')');
    } else {
      // Primera vez: mostrar selector
      selector.classList.remove('hidden');
      selector.classList.add('flex');
      console.log('📱 Mostrando selector de deporte');
    }
  }
  
  // 2. Check Supabase Config
  checkSupabaseConfig();
  
  // 3. Set default option logic or simply leave empty
  // Not setting a default as user must select a tournament matchday
  
  // 4. Render Action Categories
  renderActionCategories();

  // 5. Navegación principal por pestañas fijas
  document.querySelectorAll('.main-tab').forEach(btn => {
    btn.addEventListener('click', () => switchMainTab(btn.dataset.tab));
  });
  switchMainTab('config');

  // 6. Cerrar modales con Escape (teclado)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeTacticalPlayerModal();
    cerrarModalSuplentes();
  });

  // 7. Additional initialization for sport
  console.log(`🎯 Modo deporte inicial: ${config.nombre}`);
});

// Función para verificar configuración de Supabase
function checkSupabaseConfig() {
  const url = window.ENV?.SUPABASE_URL;
  const key = window.ENV?.SUPABASE_ANON_KEY;

  if (url && key) {
    supabaseClient = window.supabase.createClient(url, key);
  } else {
    console.error("Faltan variables de entorno para Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }
}

// --- FASE 1: CONFIGURACIÓN INICIAL ---
async function cargarJugadoras() {
  categoriaActual = document.getElementById('setup-categoria').value;
  if (!categoriaActual) return;

  // Estado vacío de la tarjeta de alineación
  const vacio = document.getElementById('alineacion-vacio');
  const contadores = document.getElementById('alineacion-counters');
  if (vacio) vacio.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando plantilla...';

  // Intentar cargar de Supabase primero, si falla usar MOCK
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('jugadoras')
        .select('nombre')
        .or(`categoria.eq.${categoriaActual},categoria_segunda.eq.${categoriaActual}`)
        .order('nombre', { ascending: true });

      if (error) throw error;

      jugadorasData = data || [];

      // Si Supabase no devuelve datos, usar MOCK
      if (jugadorasData.length === 0) {
        console.log('📦 Supabase vacío, usando MOCK_JUGADORAS');
        jugadorasData = MOCK_JUGADORAS[categoriaActual] || [];
      }
    } else {
      // Sin Supabase, usar MOCK directamente
      console.log('📦 Sin Supabase, usando MOCK_JUGADORAS');
      jugadorasData = MOCK_JUGADORAS[categoriaActual] || [];
    }
  } catch (err) {
    console.warn("Supabase no disponible, usando MOCK_JUGADORAS:", err?.message || err);
    // Fallback a MOCK
    jugadorasData = MOCK_JUGADORAS[categoriaActual] || [];
  }

  // La alineación vive en la pizarra táctica: banco limpio y once reiniciado
  suplentesBench = [];
  renderBancoSuplentes();

  if (jugadorasData.length === 0 && vacio) {
    vacio.innerHTML = 'No hay jugadoras en esta categoría.';
    vacio.classList.remove('hidden');
    contadores?.classList.add('hidden');
  } else if (vacio && contadores) {
    vacio.classList.add('hidden');
    contadores.classList.remove('hidden');
  }

  // Inicializar / refrescar la pizarra táctica con la plantilla cargada
  initTacticalBoard({ resetAssignments: true });

  // La pizarra vive en su propia pestaña: hay que abrirla para que mida bien
  setTimeout(() => {
    ensureTacticalStage();
    resizeTacticalBoard();
  }, 80);
}

// Banco de suplentes (se gestiona desde la pestaña de Táctica)
function renderBancoSuplentes() {
  const grid = document.getElementById('bench-grid');
  if (grid) {
    grid.innerHTML = '';
    if (suplentesBench.length === 0) {
      grid.innerHTML = '<p class="text-[11px] text-slate-400 italic w-full">Sin suplentes cargados</p>';
    } else {
      suplentesBench.forEach(nombre => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'player-chip bench';
        btn.title = 'Quitar del banco';
        btn.innerHTML = `<span class="truncate">${escapeHtml(nombre)}</span><i
                    class="fas fa-xmark ml-2 text-[10px] opacity-60"></i>`;
        btn.onclick = () => quitarSuplente(nombre);
        grid.appendChild(btn);
      });
    }
  }

  const counter = document.getElementById('bench-count');
  if (counter) counter.innerText = suplentesBench.length;

  actualizarContadoresSeleccion();
}

function agregarSuplente(nombre) {
  if (!nombre) return;
  const enOnce = Object.values(tacticalPositions).some(p => p.playerName === nombre);
  if (enOnce) return;
  if (!suplentesBench.includes(nombre)) suplentesBench.push(nombre);
  renderBancoSuplentes();
  drawTacticalBoard();
}

function quitarSuplente(nombre) {
  suplentesBench = suplentesBench.filter(n => n !== nombre);
  renderBancoSuplentes();
}

// Modal para elegir qué jugadoras van al banco
function abrirModalSuplentes() {
  const list = document.getElementById('bench-player-list');
  const modal = document.getElementById('bench-player-modal');
  if (!list) return;

  const enOnce = new Set(Object.values(tacticalPositions).map(p => p.playerName).filter(Boolean));
  const enBanco = new Set(suplentesBench);
  const disponibles = jugadorasData.filter(j => !enOnce.has(j.nombre) && !enBanco.has(j.nombre));

  list.innerHTML = '';
  if (disponibles.length === 0) {
    list.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-6">No quedan jugadoras disponibles en esta categoría.</p>';
  }

  disponibles.forEach(j => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-800 hover:border-sky-500/60 transition-colors text-left';
    btn.innerHTML = `<span class="text-sm font-medium">${escapeHtml(j.nombre)}</span>
        <span class="text-[11px] uppercase tracking-wider text-sky-400">Al banco</span>`;
    btn.onclick = () => {
      agregarSuplente(j.nombre);
      cerrarModalSuplentes();
    };
    list.appendChild(btn);
  });

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function cerrarModalSuplentes() {
  const modal = document.getElementById('bench-player-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Vaciar el once (dejar las posiciones libres para armar el equipo a mano)
function limpiarOnce() {
  Object.values(tacticalPositions).forEach(pos => { pos.playerName = null; });
  renderTacticalLegend();
  updateTacticalValidation();
  drawTacticalBoard();
  actualizarContadoresSeleccion();
}

// Contadores derivados de la pizarra táctica (no de checkboxes)
function actualizarContadoresSeleccion() {
  const countTit = tacticalAssignedCount();
  const countSup = suplentesBench.length;

  // Resumen en la pestaña de Configuración
  const summaryTit = document.getElementById('summary-titulares');
  const summarySup = document.getElementById('summary-suplentes');
  if (summaryTit) summaryTit.innerText = countTit;
  if (summarySup) summarySup.innerText = countSup;

  const btn = document.getElementById('btn-iniciar-partido');
  if (btn) {
    // Con pizarra táctica activa exigimos el once completo
    if (tacticalTotalSlots() > 0) {
      btn.disabled = !tacticalReady();
    } else {
      btn.disabled = !(countTit > 0 || countSup > 0);
    }
  }

  updateTacticalValidation();
}

function iniciarPartido() {
  fechaActual = document.getElementById('setup-fecha').value;
  if (!fechaActual) {
    alert("Indica la fecha.");
    return;
  }

  const boardTitulares = Object.values(tacticalPositions)
    .map(p => p.playerName)
    .filter(Boolean);

  if (tacticalTotalSlots() > 0) {
    if (!tacticalReady()) {
      alert(`Completa el 11 inicial en la pizarra táctica (${new Set(boardTitulares).size}/${tacticalTotalSlots()} posiciones asignadas). Tocá una ficha en la cancha para asignar la jugadora.`);
      return;
    }
    titulares = boardTitulares;
  } else {
    titulares = [];
  }

  suplentes = suplentesBench.filter(nombre => !titulares.includes(nombre));

  // Safety Check: Roster size
  if (titulares.length > 11) {
    alert(`Has seleccionado ${titulares.length} titulares. El máximo permitido para iniciar es 11.`);
    return;
  }

  if (titulares.length < 11) {
    if (!confirm(`Has seleccionado solo ${titulares.length} titulares (menos de 11). ¿Estás seguro que deseas continuar?`)) {
      return;
    }
  }

  // Guardar la formación táctica en Supabase (no bloquea el inicio del partido)
  persistirFormacion().catch(err => {
    console.warn('No se pudo guardar la formación táctica:', err?.message || err);
  });

  // Reiniciar cronómetro y período según el deporte activo
  clearInterval(timerInterval);
  isRunning = false;
  elapsedTime = 0;
  startTime = 0;
  cuartoActual = obtenerPeriodosDeporte()[0].id;
  updateStopwatchDisplay();
  renderPeriodSelector();

  // Init statuses
  playerStatus = {};
  titulares.forEach(j => {
    playerStatus[j] = "In_Field";
    tiempoEntrada[j] = 0; // Entran genéricamente al min 0
    tiempoJugado[j] = 0;
  });
  suplentes.forEach(j => {
    playerStatus[j] = "On_Bench";
    tiempoJugado[j] = 0;
  });

  // Populate Grids
  actualizarGrillaJugadoras();

  // Activar el partido en vivo y saltar a su pestaña
  matchStarted = true;
  switchMainTab('partido');

  // Revert button just in case we were editing
  const btn = document.getElementById('btn-iniciar-partido');
  const btnLabel = document.getElementById('btn-iniciar-label');
  if (btnLabel) btnLabel.innerText = "Iniciar Partido";
  if (btn) btn.onclick = iniciarPartido;

  // Show header edit button
  const headerEditBtn = document.getElementById('btn-header-editar');
  if (headerEditBtn) headerEditBtn.classList.remove('hidden');
}

function editarAlineacion() {
  // Volver a la pizarra táctica para editar el once
  switchMainTab('tactica');

  // La cancha estaba oculta: recalcular tamaño y redibujar
  setTimeout(() => {
    ensureTacticalStage();
    drawTacticalBoard();
    updateTacticalValidation();
  }, 60);

  const btn = document.getElementById('btn-iniciar-partido');
  const btnLabel = document.getElementById('btn-iniciar-label');
  if (btnLabel) btnLabel.innerText = "Guardar Cambios";
  if (btn) btn.onclick = guardarEdicionAlineacion;

  // Hide header edit button
  const headerEditBtn = document.getElementById('btn-header-editar');
  if (headerEditBtn) headerEditBtn.classList.add('hidden');
}

function guardarEdicionAlineacion() {
  const boardTitulares = Object.values(tacticalPositions)
    .map(p => p.playerName)
    .filter(Boolean);

  const nuevosTitulares = tacticalTotalSlots() > 0 && tacticalReady()
    ? boardTitulares
    : [];
  const nuevosSuplentes = suplentesBench.filter(nombre => !nuevosTitulares.includes(nombre));

  if (nuevosTitulares.length > 11) {
    alert(`Has seleccionado ${nuevosTitulares.length} titulares. El máximo es 11.`);
    return;
  }

  // Actualizar formación táctica guardada (best-effort)
  persistirFormacion().catch(err => {
    console.warn('No se pudo actualizar la formación táctica:', err?.message || err);
  });

  // Update logic: preserve existing times if they were already in that state
  const minActual = obtenerMinutoActual();

  // Handle Titulares
  nuevosTitulares.forEach(j => {
    if (playerStatus[j] !== "In_Field") {
      // Changed from Bench to Field, or new player entirely
      playerStatus[j] = "In_Field";
      tiempoEntrada[j] = minActual;
      if (tiempoJugado[j] === undefined) tiempoJugado[j] = 0;
    }
  });

  // Handle Suplentes
  nuevosSuplentes.forEach(j => {
    if (playerStatus[j] === "In_Field") {
      // Changed from Field to Bench -> close their time
      const minEntró = tiempoEntrada[j] || 0;
      const dif = Math.max(0, minActual - minEntró);
      tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
      playerStatus[j] = "On_Bench";
      delete tiempoEntrada[j];
    } else {
      // Was already on bench, or new bench player
      playerStatus[j] = "On_Bench";
      if (tiempoJugado[j] === undefined) tiempoJugado[j] = 0;
    }
  });

  // Clean up anyone completely unchecked
  const todosSeleccionados = new Set([...nuevosTitulares, ...nuevosSuplentes]);
  Object.keys(playerStatus).forEach(j => {
    if (!todosSeleccionados.has(j)) {
      if (playerStatus[j] === "In_Field") {
        const minEntró = tiempoEntrada[j] || 0;
        const dif = Math.max(0, minActual - minEntró);
        tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
        delete tiempoEntrada[j];
      }
      playerStatus[j] = "Removed";
    }
  });

  actualizarGrillaJugadoras();

  // Volver al partido en vivo
  matchStarted = true;
  switchMainTab('partido');

  // Clean up
  selectedPlayer = null;
  selectedSubstitute = null;
  document.getElementById('quien-selected-badge').classList.add('hidden');
  document.getElementById('btn-save-action').classList.add('opacity-50', 'pointer-events-none');

  // Re-show header edit button
  const headerEditBtn = document.getElementById('btn-header-editar');
  if (headerEditBtn) headerEditBtn.classList.remove('hidden');
}

function actualizarGrillaJugadoras() {
  const inFieldGrid = document.getElementById('players-in-field-grid');
  const benchGrid = document.getElementById('players-on-bench-grid');

  if (inFieldGrid) {
    inFieldGrid.innerHTML = `
        <button onclick="selectPlayer(this, 'No identificada')" 
            class="player-chip bench">
            <i class="fas fa-question-circle mr-1"></i> No id
        </button>
    `;
    Object.keys(playerStatus).forEach(j => {
      if (playerStatus[j] === "In_Field") {
        const btn = document.createElement('button');
        btn.className = "player-chip";
        if (j === selectedPlayer) {
          btn.classList.add('active');
        }
        btn.innerText = j;
        btn.onclick = () => selectPlayer(btn, j);
        inFieldGrid.appendChild(btn);
      }
    });
  }

  if (benchGrid) {
    benchGrid.innerHTML = '';
    Object.keys(playerStatus).forEach(j => {
      if (playerStatus[j] === "On_Bench") {
        const btn = document.createElement('button');
        btn.className = "player-chip bench";
        if (j === selectedSubstitute) {
          btn.classList.remove('bench');
          btn.classList.add('active');
        }
        btn.innerText = j;
        btn.onclick = () => selectSubstitute(btn, j);
        benchGrid.appendChild(btn);
      }
    });
  }
}

function selectPlayer(btnElement, nombre) {
  selectedPlayer = nombre;
  const badge = document.getElementById('quien-selected-badge');
  if (badge) {
    badge.innerText = nombre;
    badge.classList.remove('hidden');
  }

  // Update styling visually
  actualizarGrillaJugadoras();

  // Once both Action AND Player are selected, enable save btn
  if (currentActionId && selectedPlayer) {
    const saveBtn = document.getElementById('btn-save-action');
    saveBtn.classList.remove('opacity-50', 'pointer-events-none');
  }
}

function selectSubstitute(btnElement, nombre) {
  selectedSubstitute = nombre;
  actualizarGrillaJugadoras();
}

function selectZone(zona) {
  selectedZone = zona;

  // UI Update
  document.querySelectorAll('#zone-selector button').forEach(b => {
    b.classList.remove('active');
  });

  const btnId = `zone-${zona.toLowerCase()}`;
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add('active');
  }
}

// Agrupa las acciones del deporte activo por categoría (para los botones rápidos)
function obtenerAccionesAgrupadasDeporte() {
  const grupos = [];
  const porCategoria = new Map();

  obtenerAccionesDeporte().forEach(accion => {
    const cat = accion.categoria || 'Otras';
    if (!porCategoria.has(cat)) {
      const grupo = { cat, items: [] };
      porCategoria.set(cat, grupo);
      grupos.push(grupo);
    }
    porCategoria.get(cat).items.push(accion);
  });

  return grupos;
}

// --- FASE 2: TABLERO Y ACCIONES ---

// > Cronómetro
const stopwatchDisplay = document.getElementById('stopwatchDisplay');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');

function updateStopwatchDisplay() {
  const now = Date.now();
  const currentElapsedTime = isRunning ? elapsedTime + (now - startTime) : elapsedTime;

  let minutes, seconds;

  if (countdownMode) {
    const remainingTime = Math.max(0, getDuracionPeriodoMs() - currentElapsedTime);
    minutes = Math.floor(remainingTime / 60000);
    seconds = Math.floor((remainingTime % 60000) / 1000);

    if (remainingTime === 0 && isRunning) {
      pauseTimer();
      alert(`¡Fin del ${obtenerConfigDeporte().labelPeriodo}!`);
    }
  } else {
    minutes = Math.floor(currentElapsedTime / 60000);
    seconds = Math.floor((currentElapsedTime % 60000) / 1000);
  }

  stopwatchDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Auto-update action minute input
  if (!document.getElementById('action-minuto').value) {
    document.getElementById('action-minuto').placeholder = minutes;
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    document.getElementById('icon-play-pause').className = "fas fa-play text-blue-400";
    document.getElementById('text-play-pause').innerText = "Reanudar";
    isRunning = false;
  }
}

function setQuarter(q) {
  const periodos = obtenerPeriodosDeporte();
  if (!periodos.some(p => p.id === q)) {
    console.warn(`Período "${q}" no válido para ${deporteActual}`);
    return;
  }

  if (isRunning) {
    alert("Pausa el cronómetro antes de cambiar de período.");
    return;
  }

  const label = getPeriodoLabel(q);
  if (!confirm(`¿Cambiar al período ${label}? Esto guardará los tiempos jugados de este período y reiniciará el cronómetro a 00:00.`)) {
    return;
  }

  // Cerrar el tiempo jugado de este período para todas las que están en cancha
  const minCierreCuarto = obtenerMinutoActual();
  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "In_Field") {
      const minEntró = tiempoEntrada[j] || 0;
      const dif = Math.max(0, minCierreCuarto - minEntró);
      tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
      // Su nuevo tiempo de entrada para el próximo período es el minuto 0
      tiempoEntrada[j] = 0;
    }
  });

  cuartoActual = q;
  elapsedTime = 0;
  startTime = 0;
  updateStopwatchDisplay();
  renderPeriodSelector();
}

startStopBtn.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    document.getElementById('icon-play-pause').className = "fas fa-play text-blue-400";
    document.getElementById('text-play-pause').innerText = "Reanudar";
  } else {
    startTime = Date.now();
    timerInterval = setInterval(updateStopwatchDisplay, 1000);
    document.getElementById('icon-play-pause').className = "fas fa-pause text-yellow-400";
    document.getElementById('text-play-pause').innerText = "Pausar";
  }
  isRunning = !isRunning;
});

resetBtn.addEventListener('click', () => {
  if (confirm("¿Seguro que deseas reiniciar el cronómetro a 00:00?")) {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    startTime = 0;
    updateStopwatchDisplay();
    document.getElementById('icon-play-pause').className = "fas fa-play text-blue-400";
    document.getElementById('text-play-pause').innerText = "Iniciar";
  }
});

function obtenerMinutoActual() {
  const currentElapsedTime = isRunning ? elapsedTime + (Date.now() - startTime) : elapsedTime;
  return Math.floor(currentElapsedTime / 60000);
}

// > Goles (Marcador)
function cambiarGol(equipo, cantidad) {
  if (equipo === 'propios') {
    golesPropios = Math.max(0, golesPropios + cantidad);
    const el = document.getElementById('golesPropios');
    el.innerText = golesPropios;
    animarScore(el);
  } else {
    golesRival = Math.max(0, golesRival + cantidad);
    const el = document.getElementById('golesRival');
    el.innerText = golesRival;
    animarScore(el);

    // Log "Gol Rival" automagically if it's an addition
    if (cantidad > 0) {
      agregarLogUI("Rival", "Gol Rival", "red");
    }
  }
}

function animarScore(element) {
  element.classList.remove('anim-score');
  void element.offsetWidth; // trigger reflow
  element.classList.add('anim-score');
}

// > Interfaz de Registro Rápido
let currentActionId = null;

function renderActionCategories() {
  const catContainer = document.getElementById('action-categories');
  if (!catContainer) return;
  catContainer.innerHTML = '';

  const grupos = obtenerAccionesAgrupadasDeporte();
  if (grupos.length === 0) return;

  grupos.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip ${index === 0 ? 'active' : ''}`;
    btn.innerText = cat.cat;
    btn.onclick = () => {
      // Unify styles
      Array.from(catContainer.children).forEach(c => {
        c.className = 'chip';
      });
      btn.className = 'chip active';
      renderActionsGrid(index);
    };
    catContainer.appendChild(btn);
  });

  // Initial render
  renderActionsGrid(0);
}

function renderActionsGrid(catIndex) {
  const grid = document.getElementById('action-buttons-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const grupos = obtenerAccionesAgrupadasDeporte();
  const grupo = grupos[catIndex] || grupos[0];
  if (!grupo) return;

  const items = grupo.items;

  // Tile de una acción (se usa también para categorías de un solo elemento)
  const crearTile = (item) => {
    const btn = document.createElement('div');
    // Paleta semántica de la botonera: azul = positivo/atractivo, rojo = negativo,
    // ámbar = disciplina/atención, esmeralda solo para la tarjeta verde (objeto literal).
    let colorClass = 'text-blue-400';
    if (item.color === 'brand') colorClass = 'text-blue-300';
    if (item.color === 'blue') colorClass = 'text-blue-400';
    if (item.color === 'cyan') colorClass = 'text-blue-400';
    if (item.color === 'sky') colorClass = 'text-sky-400';
    if (item.color === 'green') colorClass = 'text-emerald-400';
    if (item.color === 'red') colorClass = 'text-red-400';
    if (item.color === 'orange') colorClass = 'text-amber-400';
    if (item.color === 'yellow') colorClass = 'text-amber-400';
    if (item.color === 'teal') colorClass = 'text-blue-400';
    if (item.color === 'purple') colorClass = 'text-sky-400';
    if (item.color === 'gray') colorClass = 'text-slate-400';

    btn.className = `action-btn items-center text-center group ${colorClass}`;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', `Acción ${item.id}`);
    btn.innerHTML = `
            <i class="fas ${item.icon} mb-0.5"></i>
            <span>${item.id}</span>
        `;

    btn.onclick = () => selectAction(btn, item);
    btn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectAction(btn, item);
      }
    };
    return btn;
  };

  // UX Shortcut: si la categoría tiene una sola acción, se muestra su tile y se auto-selecciona
  if (items.length === 1) {
    const btn = crearTile(items[0]);
    grid.appendChild(btn);
    selectAction(btn, items[0]);
    return;
  }

  items.forEach(item => {
    grid.appendChild(crearTile(item));
  });
}

function selectAction(btnElement, action) {
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  currentActionId = action.id;

  // Removing action-overlay was here, it's now deleted from HTML.
  // Instead, unlock the player-overlay
  const overlay = document.getElementById('player-overlay');
  if (overlay) {
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('pointer-events-none', 'hidden'), 300);
  }

  // Disable save button to re-evaluate after choosing player
  const saveBtn = document.getElementById('btn-save-action');
  saveBtn.classList.add('opacity-50', 'pointer-events-none');

  // If player was already selected, re-enable it
  if (selectedPlayer) {
    saveBtn.classList.remove('opacity-50', 'pointer-events-none');
  }

  const extraFields = document.getElementById('extra-sub-fields');
  if (action.id === 'Salida') {
    extraFields.classList.remove('hidden');
    selectedSubstitute = null;
    actualizarGrillaJugadoras();
  } else {
    extraFields.classList.add('hidden');
  }

  const zoneSel = document.getElementById('zone-selector');
  // La configuración de acciones usa la propiedad `zona` (no `zone`).
  if (action.zona) {
    zoneSel.classList.remove('hidden');
  } else {
    zoneSel.classList.add('hidden');
    selectedZone = null;
    document.querySelectorAll('#zone-selector button').forEach(b => {
      b.classList.remove('active');
    });
  }
}

function guardarAccionActual() {
  const jugadora = selectedPlayer;

  if (!jugadora) {
    alert("Selecciona la jugadora primero.");
    return;
  }

  if (!currentActionId) {
    alert("Selecciona una acción marcándola en la lista.");
    return;
  }

  let minutoInput = document.getElementById('action-minuto').value;
  let minutoFormateado = minutoInput ? parseInt(minutoInput) : obtenerMinutoActual();

  // 1. Process Substitution Engine specially
  if (currentActionId === 'Salida') {
    if (jugadora === 'No identificada') {
      alert('No se puede sustituir a "No identificada".'); return;
    }
    const suplente = selectedSubstitute;
    if (!suplente) { alert("Selecciona quién entra desde el banco."); return; }

    playerStatus[jugadora] = "On_Bench";
    playerStatus[suplente] = "In_Field";
    const tiempoJugadoraQueEstuvo = Math.max(0, minutoFormateado - (tiempoEntrada[jugadora] || 0));
    tiempoJugado[jugadora] = (tiempoJugado[jugadora] || 0) + tiempoJugadoraQueEstuvo;
    tiempoEntrada[suplente] = minutoFormateado;

    accionesRegistradas.push({ jugadora, accion: "Sale", minuto: minutoFormateado, cuarto: cuartoActual, zona: null });
    accionesRegistradas.push({ jugadora: suplente, accion: "Entra", minuto: minutoFormateado, cuarto: cuartoActual, zona: null });
    agregarLogUI(jugadora, `Sale <i class="fas fa-arrow-down"></i> (por ${suplente})`, "sky", minutoFormateado);
    agregarLogUI(suplente, `Entra <i class="fas fa-arrow-up"></i> (por ${jugadora})`, "sky", minutoFormateado);

    selectedSubstitute = null;
    actualizarGrillaJugadoras();

  } else {
    // 2. Normal Actions Engine (Check Zone)
    const actionConfig = obtenerAccionesDeporte().find(i => i.id === currentActionId);
    if (actionConfig && actionConfig.zona && !selectedZone) {
      alert("Esta acción requiere seleccionar una ZONA (Defensa, Medio o Ataque).");
      return;
    }

    if (currentActionId === 'Gol') {
      cambiarGol('propios', 1);
    }

    accionesRegistradas.push({
      jugadora,
      accion: currentActionId,
      valor: 1,
      minuto: minutoFormateado,
      cuarto: cuartoActual,
      zona: selectedZone
    });

    // Add to statistics aggregator map
    const key = jugadora + "_" + currentActionId;
    estadisticasJuego[key] = (estadisticasJuego[key] || 0) + 1;

    // Visual Feed
    agregarLogUI(jugadora, currentActionId, determineColorForFeed(currentActionId), minutoFormateado);
  }

  // Reset state
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
  currentActionId = null;
  selectedZone = null;
  selectedPlayer = null;
  selectedSubstitute = null;

  // Hide UI blocks
  document.getElementById('btn-save-action').classList.add('opacity-50', 'pointer-events-none');
  document.getElementById('extra-sub-fields').classList.add('hidden');
  document.getElementById('zone-selector').classList.add('hidden');
  document.getElementById('quien-selected-badge').classList.add('hidden');

  // UI Zone Reset
  document.querySelectorAll('#zone-selector button').forEach(b => {
    b.classList.remove('active');
  });

  actualizarGrillaJugadoras();
  const minInp = document.getElementById('action-minuto');
  if (minInp) minInp.value = '';

  // Actualizar estadísticas en tiempo real
  actualizarEstadisticas();
}

function switchTab(tab) {
  const btnFeed = document.getElementById('tab-btn-feed');
  const btnInsights = document.getElementById('tab-btn-insights');
  const contentFeed = document.getElementById('tab-content-feed');
  const contentInsights = document.getElementById('tab-content-insights');

  // El historial y las estadísticas viven ahora en pestañas separadas del dashboard.
  if (!btnFeed || !btnInsights || !contentFeed || !contentInsights) return;

  if (tab === 'feed') {
    btnFeed.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-brand-500 text-white shadow-lg";
    btnInsights.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-slate-400 hover:text-white";
    contentFeed.classList.remove('hidden');
    contentInsights.classList.add('hidden');
  } else {
    btnInsights.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-brand-500 text-white shadow-lg";
    btnFeed.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-slate-400 hover:text-white";
    contentInsights.classList.remove('hidden');
    contentFeed.classList.add('hidden');
    actualizarEstadisticas();
  }
}

// Agregados en vivo para la franja de KPIs de la pestaña Estadísticas
function obtenerResumenVivo() {
  const cuenta = (regex) => accionesRegistradas.filter(a => regex.test(a.accion || '')).length;
  const esFutbol = deporteActual === 'futbol';
  return {
    goles: cuenta(/^gol$/i),
    oportunidades: esFutbol
      ? cuenta(/tiro al arco|corner a favor|penalti convertido/i)
      : cuenta(/corto a favor|tiro al arco/i),
    perdidas: esFutbol
      ? cuenta(/^contra$|penalti fallado|falta cometida/i)
      : cuenta(/p[eé]rdida|quite negativo|corto en contra|falta cometida/i),
    recuperaciones: esFutbol
      ? cuenta(/recuperaci[oó]n|interceptaci[oó]n/i)
      : cuenta(/quite positivo|recuperaci[oó]n/i),
    disciplina: cuenta(/falta|tarjeta/i)
  };
}

// Etiquetas de los KPIs según el deporte activo
function renderKpiLabels() {
  const esFutbol = deporteActual === 'futbol';
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };
  set('kpi-perdidas-label', esFutbol ? 'Contras' : 'Pérdidas');
  set('kpi-recuperaciones-label', esFutbol ? 'Recuperaciones' : 'Robos');
  set('zones-recovery-title', esFutbol ? 'Recuperaciones por Zona' : 'Robos por Zona');
}

function actualizarEstadisticas() {
  // 0. Contexto del partido en la cabecera de la pestaña
  const info = document.getElementById('stats-match-info');
  if (info) {
    info.innerText = fechaActual
      ? `${fechaActual} · ${categoriaActual} · ${golesPropios} - ${golesRival}`
      : 'Sin partido configurado';
  }

  // 0b. Agregados en vivo (franja de KPIs)
  renderKpiLabels();
  const resumen = obtenerResumenVivo();
  const setKpi = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
  };
  setKpi('kpi-goles', resumen.goles);
  setKpi('kpi-oportunidades', resumen.oportunidades);
  setKpi('kpi-perdidas', resumen.perdidas);
  setKpi('kpi-recuperaciones', resumen.recuperaciones);
  setKpi('kpi-disciplina', resumen.disciplina);

  // 1. Efficiency / Ratios
  let recuperaciones = 0;
  let perdidas = 0;

  // 2. Exits Distribution
  const salidas = { linea: 0, x: 0, medio: 0 };

  // 3. Zones
  const perdidasZona = { "Defensa": 0, "Medio": 0, "Ataque": 0 };
  const robosZona = { "Defensa": 0, "Medio": 0, "Ataque": 0 };

  // 4. Estadísticas por período (cuartos en hockey, tiempos en fútbol)
  const periodos = obtenerPeriodosDeporte();
  const qStats = {};
  periodos.forEach(p => {
    qStats[p.id] = { goles: 0, cortos: 0, perdidas: 0 };
  });

  accionesRegistradas.forEach(a => {
    // Exit Tracking
    if (a.accion === "Gesto Salida Linea") salidas.linea++;
    if (a.accion === "Gesto Salida X") salidas.x++;
    if (a.accion === "Gesto Salida al medio") salidas.medio++;

    // Robo / Recup Logic
    if (a.accion === "Quite positivo" || a.accion === "Recuperación") {
      recuperaciones++;
      if (a.zona) robosZona[a.zona]++;
    }

    // Loss Logic
    if (a.accion === "Pérdida") {
      perdidas++;
      if (a.zona) perdidasZona[a.zona]++;
    }

    // Mapeo por período
    if (a.cuarto && qStats[a.cuarto]) {
      if (a.accion === "Gol") qStats[a.cuarto].goles++;
      if (/corto a favor|corner a favor/i.test(a.accion)) qStats[a.cuarto].cortos++;
      // Tercera métrica: Pérdidas en hockey, Tiros al arco en fútbol
      if (deporteActual === 'futbol') {
        if (a.accion === "Tiro al arco") qStats[a.cuarto].perdidas++;
      } else if (a.accion === "Pérdida") {
        qStats[a.cuarto].perdidas++;
      }
    }
  });

  // Update UI - Ratio R/P
  const ratio = perdidas > 0 ? (recuperaciones / perdidas).toFixed(1) : recuperaciones.toFixed(1);
  document.getElementById('stat-ratio-rp').innerText = ratio;
  const totalRP = recuperaciones + perdidas;
  if (totalRP > 0) {
    const pctR = Math.round((recuperaciones / totalRP) * 100);
    const pctP = 100 - pctR;
    document.getElementById('bar-ratio-recup').style.width = `${pctR}%`;
    document.getElementById('bar-ratio-perd').style.width = `${pctP}%`;
  } else {
    // Sin datos no hay reparto: barras en cero (un 50/50 azul-rojo sería una lectura falsa)
    document.getElementById('bar-ratio-recup').style.width = '0%';
    document.getElementById('bar-ratio-perd').style.width = '0%';
  }

  // Update UI - Exits Distribution
  const totalSalidas = salidas.linea + salidas.x + salidas.medio;
  const sTypes = ["linea", "x", "medio"];
  document.getElementById('val-salida-linea').innerText = salidas.linea;
  document.getElementById('val-salida-x').innerText = salidas.x;
  document.getElementById('val-salida-medio').innerText = salidas.medio;

  if (totalSalidas > 0) {
    sTypes.forEach(t => {
      const pct = Math.round((salidas[t] / totalSalidas) * 100);
      document.getElementById(`bar-salida-${t}`).style.width = `${pct}%`;
    });
  } else {
    // Sin salidas registradas no se reparte la barra entre tipos
    sTypes.forEach(t => document.getElementById(`bar-salida-${t}`).style.width = '0%');
  }

  // Update UI - Zones (Pérdidas)
  const maxP = Math.max(1, perdidas);
  ["Defensa", "Medio", "Ataque"].forEach(z => {
    const val = perdidasZona[z];
    const pct = Math.round((val / maxP) * 100);
    document.getElementById(`bar-zona-${z.toLowerCase()}`).style.width = `${pct}%`;
    document.getElementById(`val-zona-${z.toLowerCase()}`).innerText = val;
  });

  // Update UI - Zones (Robos)
  const maxR = Math.max(1, recuperaciones);
  ["Defensa", "Medio", "Ataque"].forEach(z => {
    const val = robosZona[z];
    const pct = Math.round((val / maxR) * 100);
    const bar = document.getElementById(`bar-robo-${z.toLowerCase()}`);
    if (bar) bar.style.width = `${pct}%`;
    const span = document.getElementById(`val-robo-${z.toLowerCase()}`);
    if (span) span.innerText = val;
  });

  // Update UI - Infracciones y tarjetas
  const tarjetas = {
    amarilla: accionesRegistradas.filter(a => /tarjeta amarilla/i.test(a.accion || '')).length,
    roja: accionesRegistradas.filter(a => /tarjeta roja/i.test(a.accion || '')).length,
    faltas: accionesRegistradas.filter(a => /falta/i.test(a.accion || '')).length
  };
  ['amarilla', 'roja'].forEach(t => {
    const el = document.getElementById(`val-tarjeta-${t}`);
    if (el) el.innerText = tarjetas[t];
  });
  const elFaltas = document.getElementById('val-faltas');
  if (elFaltas) elFaltas.innerText = tarjetas.faltas;

  // Update UI - Estadísticas por período
  const qRows = document.getElementById('q-stats-rows');
  qRows.innerHTML = '';
  periodos.forEach(p => {
    const s = qStats[p.id];
    const isCurrent = cuartoActual === p.id;
    qRows.innerHTML += `
      <div class="grid grid-cols-4 gap-1 py-1 border-b border-white/5 items-center ${isCurrent ? 'bg-white/5 rounded-lg -mx-1 px-1' : ''}">
        <span class="text-[11px] font-bold ${isCurrent ? 'text-blue-400' : 'text-slate-400'}">${p.label}</span>
        <span class="text-center text-xs font-mono text-white">${s.goles}</span>
        <span class="text-center text-xs font-mono text-white">${s.cortos}</span>
        <span class="text-center text-xs font-mono text-white">${s.perdidas}</span>
      </div>
    `;
  });
}

function determineColorForFeed(act) {
  const a = String(act || '').toLowerCase();
  if (a.includes('gol')) return 'brand';
  if (a.includes('gesto')) return 'blue';
  if (a.includes('tarjeta verde')) return 'emerald';
  if (a.includes('tarjeta roja') || a.includes('negativ') || a.includes('pérdida') || a.includes('perdida')
    || a.includes('en contra') || a === 'contra' || a.includes('penalti fallado')) return 'red';
  if (a.includes('positiv') || a.includes('a favor') || a.includes('recuperación')
    || a.includes('asistencia') || a.includes('interceptación')) return 'cyan';
  return 'gray';
}

function agregarLogUI(nombre, accionTexto, colorTheme, minuto = null) {
  const feed = document.getElementById('tab-content-feed');
  if (!feed) return;
  // Remove "empty" message if exists
  if (feed.children.length === 1 && feed.children[0].tagName === 'P') {
    feed.innerHTML = '';
  }

  let dotColor = '#64748b';
  let labelColor = 'text-slate-300';

  if (colorTheme === 'brand') { dotColor = '#3b82f6'; labelColor = 'text-blue-300'; }
  if (colorTheme === 'blue') { dotColor = '#3b82f6'; labelColor = 'text-blue-300'; }
  if (colorTheme === 'cyan') { dotColor = '#60a5fa'; labelColor = 'text-blue-300'; }
  if (colorTheme === 'emerald') { dotColor = '#34d399'; labelColor = 'text-emerald-300'; }
  if (colorTheme === 'red') { dotColor = '#ef4444'; labelColor = 'text-red-300'; }
  if (colorTheme === 'sky') { dotColor = '#38bdf8'; labelColor = 'text-sky-300'; }

  const timeStr = minuto ? `${minuto}'` : obtenerMinutoActual() + "'";
  const quarterStr = getPeriodoLabel(cuartoActual);

  // Jerarquía del feed: el evento es el dato dominante, la jugadora el secundario.
  const logHTML = `
        <div class="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/70 shadow-sm animate-[fadeIn_0.3s_ease]">
            <div class="flex justify-between items-start gap-2 mb-1.5">
                <span class="font-mono text-sm font-extrabold uppercase tracking-wide ${labelColor}">${accionTexto}</span>
                <div class="flex gap-1.5 shrink-0">
                    <span class="text-[11px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded font-bold">${quarterStr}</span>
                    <span class="text-[11px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">${timeStr}</span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="feed-dot" style="background:${dotColor}"></span>
                <span class="text-[11px] text-slate-400 truncate">${nombre}</span>
            </div>
        </div>
    `;

  feed.insertAdjacentHTML('afterbegin', logHTML);

  const counter = document.getElementById('feed-count');
  if (counter) counter.innerText = feed.children.length;
}

// --- FASE 3: FINALIZAR PARTIDO (Guardado 100% Client-Side vía Supabase) ---

let isSavingMatch = false;
let accionesYaInsertadas = false;

async function finalizarPartido() {
  if (isSavingMatch) return;
  if (!supabaseClient) {
    alert("Sin conexión a Supabase configurada."); return;
  }
  if (!confirm("¿Estás seguro que deseas finalizar el partido? Esto calculará los tiempos y enviará la info a la base de datos.")) {
    return;
  }

  isSavingMatch = true;

  // 1. Terminar de calcular tiempo jugado para las que están actualmente en campo
  const minCierre = obtenerMinutoActual();
  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "In_Field") {
      const minEntró = tiempoEntrada[j] || 0;
      const dif = Math.max(0, minCierre - minEntró);
      tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
    }
  });

  const btn = window.event ? window.event.currentTarget : null;
  if (btn) {
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...`;
    btn.disabled = true;
  }

  try {

    // 2. Format Resumen General Match Table
    const matchData = {
      partido_fecha: fechaActual,
      categoria: categoriaActual,
      goles_propios_totales: golesPropios,
      goles_rival_totales: golesRival
    };

    // Insert Match Header
    const { error: errMatch } = await supabaseClient
      .from('resumen_partidos')
      .upsert([matchData], { onConflict: 'partido_fecha,categoria' });

    if (errMatch) throw errMatch;

    // 3. Format Raw Actions logs History (optional but useful)
    if (accionesRegistradas.length > 0 && !accionesYaInsertidas) {
      const dbActions = accionesRegistradas.map(a => ({
        partido_fecha: fechaActual,
        categoria: categoriaActual,
        jugadora_nombre: a.jugadora,
        accion_tipo: a.accion,
        valor: a.valor || 1,
        minuto: a.minuto,
        cuarto: a.cuarto || null,
        zona: a.zona || null
      }));

      const { error: errAct } = await supabaseClient.from('acciones').insert(dbActions);
      if (errAct) {
        console.warn("Error insertando acciones crudas. Omitido.", errAct);
      } else {
        accionesYaInsertidas = true;
      }
    }


    // 4. Transform individual stats to Supabase schema 'resumen_jugadoras'
    // Exclude anyone who was checked then fully unchecked during edits.
    const allPlayersInvolved = Object.keys(playerStatus).filter(j => playerStatus[j] !== "Removed");

    const individualStatsBatch = allPlayersInvolved.map(j => {
      const getA = (accion_exacta) => Number(estadisticasJuego[`${j}_${accion_exacta}`]) || 0;

      const baseStats = {
        partido_fecha: fechaActual,
        categoria: categoriaActual,
        jugadora_nombre: j,
        tiempo_jugado: Math.min(getTotalMinutosPartido(), Math.round(Number(tiempoJugado[j])) || 0)
      };

      // Fútbol: campos propios del deporte
      if (deporteActual === 'futbol') {
        return {
          ...baseStats,
          goles: getA("Gol"),
          asistencias: getA("Asistencia"),
          tiro_al_arco: getA("Tiro al arco"),
          tiro_fuera: getA("Fuera de arco"),
          falta_cometida: getA("Falta"),
          tarjeta_amarilla: getA("Tarjeta amarilla"),
          tarjeta_roja: getA("Tarjeta roja"),
          corner_a_favor: getA("Corner a favor"),
          corner_en_contra: getA("Corner en contra"),
          penalti_convertido: getA("Penalti convertido"),
          penaltiFallado: getA("Penalti fallado"),
          recuperacion_balon: getA("Recuperación"),
          interceptaciones: getA("Interceptación")
        };
      }

      // Hockey (schema original)
      return {
        ...baseStats,
        goles: getA("Gol"),
        gesto_bloqueo: getA("Gesto Bloqueo"),
        gesto_flick: getA("Gesto Flick"),
        gesto_salida_linea: getA("Gesto Salida Linea"),
        gesto_salida_x: getA("Gesto Salida X"),
        gesto_salida_al_medio: getA("Gesto Salida al medio"),
        tarjeta_amarilla: getA("Tarjeta amarilla"),
        tarjeta_roja: getA("Tarjeta roja"),
        tarjeta_verde: getA("Tarjeta verde"),
        quite_positivo: getA("Quite positivo"),
        quite_negativo: getA("Quite negativo"),
        recuperacion: getA("Recuperación"),
        falta_recibida: getA("Falta recibida"),
        corto_a_favor: getA("Corto a Favor"),
        corto_en_contra: getA("Corto en Contra"),
        tiro_al_arco: getA("Tiro al arco")
      };
    });

    const { error: errPData } = await supabaseClient
      .from('resumen_jugadoras')
      .upsert(individualStatsBatch, { onConflict: 'partido_fecha,categoria,jugadora_nombre' });

    if (errPData) throw errPData;

    // Success UI
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check bg-blue-500 rounded-full w-6 h-6 inline-flex items-center justify-center text-white mr-2"></i> ¡Guardado Exitoso!`;
      btn.classList.replace('border-red-500/40', 'border-blue-500');
      btn.classList.replace('text-red-400', 'text-blue-400');
    }

    setTimeout(() => {
      alert("El partido fue guardado exitosamente.");
      isSavingMatch = false; // Just in case, though reload will happen
      location.reload();
    }, 1500);

  } catch (e) {
    console.error("Error Guardando en Supabase: ", e);
    if (btn) {
      btn.innerHTML = `<i class="fas fa-times mr-2"></i> Error. Revisa consola.`;
      btn.disabled = false;
    }
    isSavingMatch = false;
    alert("Hubo un error al guardar en la Base de Datos. Detalles en la consola F12.");
  }
}

// --- COACH IA CHAT LOGIC ---
let currentChatSessionId = null;

function getStoredSessions() {
  try {
    const raw = localStorage.getItem('palihue_coach_sessions');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Error reading localStorage", e);
    return {};
  }
}

function saveStoredSessions(sessions) {
  try {
    localStorage.setItem('palihue_coach_sessions', JSON.stringify(sessions));
  } catch (e) {
    console.error("Error writing localStorage", e);
  }
}

function toggleCoachChat() {
  const panel = document.getElementById('coach-chat-panel');
  if (!panel) return;
  panel.classList.toggle('translate-x-full');
  
  if (!panel.classList.contains('translate-x-full')) {
    // Panel is opening
    const sessions = getStoredSessions();
    if (!currentChatSessionId || !sessions[currentChatSessionId]) {
      // Find latest session or start new one
      const keys = Object.keys(sessions);
      if (keys.length > 0) {
        keys.sort((a, b) => b.localeCompare(a));
        loadSession(keys[0]);
      } else {
        startNewSession();
      }
    } else {
      loadSession(currentChatSessionId);
    }
  }
}

function startNewSession() {
  const sessions = getStoredSessions();
  const timestamp = Date.now();
  const chatId = `session-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  
  sessions[chatId] = {
    title: `Conversación ${dateStr}`,
    messages: [
      {
        role: 'model',
        text: '¡Hola! Soy tu Coach IA. Estoy listo para ayudarte a analizar tus partidos o darte consejos tácticos. ¿De qué te gustaría hablar hoy?'
      }
    ]
  };
  
  saveStoredSessions(sessions);
  loadSession(chatId);
}

function loadSession(chatId) {
  currentChatSessionId = chatId;
  const sessions = getStoredSessions();
  const session = sessions[chatId];
  if (!session) return;
  
  document.getElementById('sessions-list-container').classList.add('hidden');
  document.getElementById('chat-active-container').classList.remove('hidden');
  
  const messagesBox = document.getElementById('coach-chat-messages');
  messagesBox.innerHTML = '';
  
  session.messages.forEach(msg => {
    appendMessageToUI(msg.text, msg.role);
  });
  
  const histBtn = document.getElementById('btn-chat-history');
  if (histBtn) {
    histBtn.innerHTML = `<i class="fas fa-history mr-1"></i> Historial`;
  }
}

function toggleSessionsList() {
  const listContainer = document.getElementById('sessions-list-container');
  const chatContainer = document.getElementById('chat-active-container');
  const histBtn = document.getElementById('btn-chat-history');
  
  if (listContainer.classList.contains('hidden')) {
    listContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    renderSessionsListUI();
    if (histBtn) histBtn.innerHTML = `<i class="fas fa-comments mr-1"></i> Volver`;
  } else {
    if (currentChatSessionId) {
      loadSession(currentChatSessionId);
    }
  }
}

function renderSessionsListUI() {
  const sessions = getStoredSessions();
  const listEl = document.getElementById('sessions-list');
  listEl.innerHTML = '';
  
  const keys = Object.keys(sessions);
  if (keys.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-10">No hay conversaciones guardadas.</p>`;
    return;
  }
  
  keys.sort((a, b) => b.localeCompare(a));
  
  keys.forEach(key => {
    const s = sessions[key];
    const isCurrent = key === currentChatSessionId;
    
    const div = document.createElement('div');
    const isCurrentCls = 'bg-blue-500/20 border-blue-500 text-white';
    const isIdleCls = 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800';
    div.className = `flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${isCurrent ? isCurrentCls : isIdleCls}`;
    div.onclick = () => loadSession(key);
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-xs font-semibold truncate flex-1';
    titleSpan.innerText = s.title;
    div.appendChild(titleSpan);
    
    const delBtn = document.createElement('button');
    delBtn.className = 'text-slate-400 hover:text-red-400 p-1.5 ml-2 transition-colors';
    delBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSession(key);
    };
    div.appendChild(delBtn);
    
    listEl.appendChild(div);
  });
}

function deleteSession(chatId) {
  if (!confirm('¿Seguro que deseas eliminar esta conversación?')) return;
  const sessions = getStoredSessions();
  delete sessions[chatId];
  saveStoredSessions(sessions);
  
  if (chatId === currentChatSessionId) {
    currentChatSessionId = null;
    const keys = Object.keys(sessions);
    if (keys.length > 0) {
      loadSession(keys[0]);
    } else {
      startNewSession();
    }
  } else {
    renderSessionsListUI();
  }
}

function appendMessageToUI(text, role) {
  const messagesBox = document.getElementById('coach-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-message-bubble ${role === 'user' ? 'chat-message-user' : 'chat-message-coach'}`;
  
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1 rounded text-red-300">$1</code>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '• $1')
    .replace(/\n/g, '<br>');
  
  bubble.innerHTML = html;
  messagesBox.appendChild(bubble);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function handleSendChat(event) {
  if (event) event.preventDefault();
  const inputEl = document.getElementById('coach-chat-input');
  const text = inputEl.value.trim();
  if (!text) return;
  
  inputEl.value = '';
  appendMessageToUI(text, 'user');
  
  const sessions = getStoredSessions();
  const session = sessions[currentChatSessionId];
  if (!session) return;
  
  session.messages.push({ role: 'user', text });
  
  if (session.messages.filter(m => m.role === 'user').length === 1) {
    session.title = text.length > 25 ? text.substring(0, 25) + '...' : text;
  }
  saveStoredSessions(sessions);
  
  const loader = document.getElementById('chat-typing-indicator');
  if (loader) loader.classList.remove('hidden');
  
  const messagesBox = document.getElementById('coach-chat-messages');
  messagesBox.scrollTop = messagesBox.scrollHeight;
  
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: currentChatSessionId,
        message: text,
        history: session.messages.slice(0, -1)
      })
    });
    
    const data = await response.json();
    if (loader) loader.classList.add('hidden');
    
    if (data.status === 'success' && data.reply) {
      appendMessageToUI(data.reply, 'model');
      session.messages.push({ role: 'model', text: data.reply });
      saveStoredSessions(sessions);
    } else {
      const errorMsg = data.message || 'El Coach no pudo responder en este momento.';
      appendMessageToUI(`⚠️ Error: ${errorMsg}`, 'model');
    }
  } catch (error) {
    console.error('Error fetching Coach Agent:', error);
    if (loader) loader.classList.add('hidden');
    appendMessageToUI('⚠️ Error de conexión con el Coach IA. Asegúrate de tener levantadas las funciones serverless.', 'model');
  }
}

function sendQuickPrompt(text) {
  const inputEl = document.getElementById('coach-chat-input');
  if (inputEl) {
    inputEl.value = text;
    handleSendChat();
  }
}

// --- EXPORTAR A WINDOW (Para Vite Modules) ---
window.cargarJugadoras = cargarJugadoras;
window.iniciarPartido = iniciarPartido;
window.cambiarGol = cambiarGol;
window.selectAction = selectAction;
window.guardarAccionActual = guardarAccionActual;
window.finalizarPartido = finalizarPartido;
window.renderActionCategories = renderActionCategories;
window.renderActionsGrid = renderActionsGrid;
window.actualizarContadoresSeleccion = actualizarContadoresSeleccion;
window.setQuarter = setQuarter;
window.selectPlayer = selectPlayer;
window.selectSubstitute = selectSubstitute;
window.selectZone = selectZone;
window.switchTab = switchTab;
window.editarAlineacion = editarAlineacion;
window.guardarEdicionAlineacion = guardarEdicionAlineacion;
window.toggleCoachChat = toggleCoachChat;
window.startNewSession = startNewSession;
window.loadSession = loadSession;
window.toggleSessionsList = toggleSessionsList;
window.deleteSession = deleteSession;
window.handleSendChat = handleSendChat;
window.sendQuickPrompt = sendQuickPrompt;
window.switchMainTab = switchMainTab;
window.renderBancoSuplentes = renderBancoSuplentes;
window.abrirModalSuplentes = abrirModalSuplentes;
window.cerrarModalSuplentes = cerrarModalSuplentes;
window.agregarSuplente = agregarSuplente;
window.quitarSuplente = quitarSuplente;
window.limpiarOnce = limpiarOnce;
window.renderKpiLabels = renderKpiLabels;
window.initTacticalBoard = initTacticalBoard;
window.selectTacticalSchema = selectTacticalSchema;
window.openTacticalPlayerModal = openTacticalPlayerModal;
window.closeTacticalPlayerModal = closeTacticalPlayerModal;
window.assignTacticalPlayer = assignTacticalPlayer;
window.clearTacticalPosition = clearTacticalPosition;
window.persistirFormacion = persistirFormacion;

// Estado de la pizarra (útil para depuración e integraciones)
window.getTacticalState = () => ({
  deporte: deporteActual,
  esquema: currentSchema,
  total: tacticalTotalSlots(),
  asignadas: tacticalAssignedCount(),
  nodos: tacticalTokenNodes.length,
  posiciones: Object.values(tacticalPositions).map(p => ({
    id: p.id,
    label: p.label,
    x: p.xPct,
    y: p.yPct,
    jugadora: p.playerName || null
  }))
});

// Export sport handlers to global scope for onclick handlers
window.selectSport = selectSport;
window.cambiarDeporte = cambiarDeporte;
