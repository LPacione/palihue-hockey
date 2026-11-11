// Seed script: Carga de datos mockeados para Supabase (Hockey y Fútbol)
// Este script pobla las tablas jugadoras, resumen_partidos, resumen_jugadoras y acciones
// con datos de prueba para poder desarrollar y probar la web app sin necesidad de ingresar
// datos manualmente cada vez. Se adapta automáticamente al deporte seleccionado.
//
// Requisitos:
// - Tener las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env.local
// - Las tablas de Supabase deben existir con la estructura esperada (ver code.js y api/agent.js)
//
// Ejecutar: node seed-mock-data.js
// Nota: Este script leerá el deporte actual desde localStorage o code.js CONFIG_DEPORTES

// Cargar variables de entorno
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE DEPORTES (debe coincidir con code.js)
// ---------------------------------------------------------------------------
const CONFIG_DEPORTES = {
  hockey: {
    nombre: 'Hockey Césped',
    emoji: '⛸️',
    acciones: [
      { id: 'Gol', categoria: 'Ofensiva', color: 'brand', zona: false },
      { id: 'Gesto Bloqueo', categoria: 'Gestos', color: 'blue', zona: false },
      { id: 'Gesto Flick', categoria: 'Gestos', color: 'blue', zona: false },
      { id: 'Gesto Salida Linea', categoria: 'Gestos', color: 'blue', zona: false },
      { id: 'Gesto Salida X', categoria: 'Gestos', color: 'blue', zona: false },
      { id: 'Gesto Salida al medio', categoria: 'Gestos', color: 'blue', zona: false },
      { id: 'Pérdida', categoria: 'Pérdidas', color: 'red', zona: true },
      { id: 'Quite positivo', categoria: 'Defensiva', color: 'teal', zona: true },
      { id: 'Quite negativo', categoria: 'Defensiva', color: 'red', zona: true },
      { id: 'Recuperación', categoria: 'Defensiva', color: 'teal', zona: true },
      { id: 'Falta recibida', categoria: 'Infracciones', color: 'orange', zona: true },
      { id: 'Falta cometida', categoria: 'Infracciones', color: 'red', zona: true },
      { id: 'Tarjeta verde', categoria: 'Tarjetas', color: 'green', zona: false },
      { id: 'Tarjeta amarilla', categoria: 'Tarjetas', color: 'yellow', zona: false },
      { id: 'Tarjeta roja', categoria: 'Tarjetas', color: 'red', zona: false },
      { id: 'Corto a Favor', categoria: 'Ofensiva', color: 'green', zona: false },
      { id: 'Corto en Contra', categoria: 'Ofensiva', color: 'red', zona: false },
      { id: 'Tiro al arco', categoria: 'Ofensiva', color: 'green', zona: false },
      { id: 'Salida', categoria: 'Sustitución', color: 'purple', zona: false }
    ],
    estadisticasCampos: [
      'tiempo_jugado', 'goles', 'gesto_bloqueo', 'gesto_flick',
      'gesto_salida_linea', 'gesto_salida_x', 'gesto_salida_al_medio',
      'tarjeta_amarilla', 'tarjeta_roja', 'tarjeta_verde',
      'quite_positivo', 'quite_negativo', 'recuperacion',
      'falta_recibida', 'corto_a_favor', 'corto_en_contra', 'tiro_al_arco'
    ],
    labelTiempo: 'minutos por cuarto',
    minutosPartido: 60,
    labelPartido: 'Cuartos'
  },
  futbol: {
    nombre: 'Fútbol',
    emoji: '⚽',
    acciones: [
      { id: 'Gol', categoria: 'Ofensiva', color: 'brand', zona: false },
      { id: 'Asistencia', categoria: 'Ofensiva', color: 'teal', zona: false },
      { id: 'Tiro al arco', categoria: 'Ofensiva', color: 'green', zona: false },
      { id: 'Fuera de arco', categoria: 'Ofensiva', color: 'gray', zona: false },
      { id: 'Falta', categoria: 'Infracciones', color: 'red', zona: true },
      { id: 'Tarjeta amarilla', categoria: 'Tarjetas', color: 'yellow', zona: false },
      { id: 'Tarjeta roja', categoria: 'Tarjetas', color: 'red', zona: false },
      { id: 'Penalti', categoria: 'Set-piece', color: 'brand', zona: true },
      { id: 'Corner a favor', categoria: 'Set-piece', color: 'teal', zona: true },
      { id: 'Corner en contra', categoria: 'Set-piece', color: 'orange', zona: true },
      { id: 'Contra', categoria: 'Transición', color: 'purple', zona: true },
      { id: 'Balón parado', categoria: 'Set-piece', color: 'orange', zona: false },
      { id: 'Salida', categoria: 'Sustitución', color: 'purple', zona: false }
    ],
    estadisticasCampos: [
      'tiempo_jugado', 'goles', 'asistencias', 'tiro_al_arco',
      'tiro_fuera', 'falta_cometida', 'tarjeta_amarilla', 'tarjeta_roja',
      'corner_a_favor', 'corner_en_contra', 'penalti_convertido', 'penaltiFallado',
      'recuperacion_balon', 'interceptaciones'
    ],
    labelTiempo: 'minutos por mitad',
    minutosPartido: 90,
    labelPartido: 'Mitades'
  }
};

// Obtener configuración actual (simulada - en producción leería de code.js)
function obtenerConfigDeporteActual() {
  // Intentar leer de localStorage o code.js
  try {
    const almacenado = localStorage.getItem('palihue_deporte');
    if (almacenado && CONFIG_DEPORTES[almacenado]) {
      return CONFIG_DEPORTES[almacenado];
    }
  } catch (e) {
    // localStorage no disponible o error
  }
  // Default a hockey
  return CONFIG_DEPORTES.hockey;
}

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Datos mockeados: listas de jugadoras por categoría (mismo para ambos deportes)
// ---------------------------------------------------------------------------
const MOCK_PLAYERS_BY_CATEGORY = {
  '7ma_fem': [
    { nombre: 'Laura García', categoria: '7ma_fem' },
    { nombre: 'María López', categoria: '7ma_fem' },
    { nombre: 'Sofía Martínez', categoria: '7ma_fem' },
    { nombre: 'Valentina Rodríguez', categoria: '7ma_fem' },
    { nombre: 'Paula Gómez', categoria: '7ma_fem' },
    { nombre: 'Lucía Fernández', categoria: '7ma_fem' },
    { nombre: 'Carla Sánchez', categoria: '7ma_fem' },
    { nombre: 'Andrea Torres', categoria: '7ma_fem' }
  ],
  '6ta_fem': [
    { nombre: 'Carmen Díaz', categoria: '6ta_fem' },
    { nombre: 'Patricia Ramírez', categoria: '6ta_fem' },
    { nombre: 'Beatriz Serrano', categoria: '6ta_fem' },
    { nombre: 'Elena Pérez', categoria: '6ta_fem' },
    { nombre: 'Natalia Cruz', categoria: '6ta_fem' },
    { nombre: 'Irene Gil', categoria: '6ta_fem' },
    { nombre: 'Aitana Bueno', categoria: '6ta_fem' },
    { nombre: 'Claudia Morales', categoria: '6ta_fem' }
  ],
  '5ta_fem': [
    { nombre: 'Sara Jiménez', categoria: '5ta_fem' },
    { nombre: 'Diego López', categoria: '5ta_fem' },
    { nombre: 'Marina Torres', categoria: '5ta_fem' },
    { nombre: 'Nerea Ruiz', categoria: '5ta_fem' },
    { nombre: 'Aroa Sánchez', categoria: '5ta_fem' },
    { nombre: 'Claudia Navarro', categoria: '5ta_fem' },
    { nombre: 'Iria Gil', categoria: '5ta_fem' },
    { nombre: 'Daniela Gómez', categoria: '5ta_fem' }
  ],
  '1ra_fem': [
    { nombre: 'Carla Herrera', categoria: '1ra_fem' },
    { nombre: 'Valeria Romero', categoria: '1ra_fem' },
    { nombre: 'Beatriz Castro', categoria: '1ra_fem' },
    { nombre: 'Laura Alonso', categoria: '1ra_fem' },
    { nombre: 'Sofía Navarro', categoria: '1ra_fem' },
    { nombre: 'Andrea Díaz', categoria: '1ra_fem' },
    { nombre: 'Jimena Suárez', categoria: '1ra_fem' },
    { nombre: 'Paloma Molina', categoria: '1ra_fem' }
  ],
  '1ra_masc': [
    { nombre: 'Diego Álvarez', categoria: '1ra_masc' },
    { nombre: 'Lucas Fernández', categoria: '1ra_masc' },
    { nombre: 'Martín García', categoria: '1ra_masc' },
    { nombre: 'Santiago Rodríguez', categoria: '1ra_masc' },
    { nombre: 'Tomás López', categoria: '1ra_masc' },
    { nombre: 'Pablo Pérez', categoria: '1ra_masc' },
    { nombre: 'Andrés Martín', categoria: '1ra_masc' },
    { nombre: 'Javier Jiménez', categoria: '1ra_masc' }
  ]
};

// ---------------------------------------------------------------------------
// Fechas y categorías para partidos mockeados
// ---------------------------------------------------------------------------
const MOCK_DATES = ['Fecha 1', 'Fecha 2', 'Fecha 3', 'Fecha 4', 'Fecha 5', 'Amistoso', 'Playoffs'];
const MOCK_CATEGORIES = ['7ma_fem', '6ta_fem', '5ta_fem', '1ra_fem', '1ra_masc'];

// ---------------------------------------------------------------------------
// 1. Insertar jugadoras en la tabla 'jugadoras'
// ---------------------------------------------------------------------------
async function insertMockJugadoras() {
  console.log('🔄 Insertando jugadoras mockeadas...');

  const config = obtenerConfigDeporteActual();

  for (const [categoria, players] of Object.entries(MOCK_PLAYERS_BY_CATEGORY)) {
    for (const player of players) {
      const { error } = await supabase
        .from('jugadoras')
        .insert({
          nombre: player.nombre,
          categoria: player.categoria,
        });

      if (error) {
        console.error(`❌ Error insertando ${player.nombre} (${categoria}):`, error.message);
      } else {
        console.log(`✅ Insertado: ${player.nombre} (${categoria})`);
      }
    }
  }

  console.log('✅ Finalizado insertado de jugadoras.\n');
}

// ---------------------------------------------------------------------------
// 2. Insertar partidos mockeados en 'resumen_partidos'
// ---------------------------------------------------------------------------
async function insertMockPartidos() {
  console.log('🔄 Insertando partidos mockeados...');

  const config = obtenerConfigDeporteActual();
  const matches = [];

  // Para cada categoría, creamos 2-3 partidos aleatorios
  for (const categoria of MOCK_CATEGORIES) {
    const numMatches = randomInt(2, 4);
    const players = MOCK_PLAYERS_BY_CATEGORY[categoria] || [];

    for (let i = 0; i < numMatches; i++) {
      const fecha = choose(MOCK_DATES);
      
      // Para fútbol: goles típicamente 0-8, para hockey 0-8 también pero más bajos usualmente
      const propios = randomInt(0, config.labelPartido === 'Mitades' ? 8 : 6);
      const rival = randomInt(0, config.labelPartido === 'Mitades' ? 6 : 4);
      const resultado = propios > rival ? 'Victoria' : propios < rival ? 'Derrota' : 'Empate';

      const matchData = {
        partido_fecha: fecha,
        categoria: categoria,
        goles_propios_totales: propios,
        goles_rival_totales: rival
      };

      matches.push(matchData);

      const { error } = await supabase.from('resumen_partidos').insert(matchData);

      if (error) {
        console.error(`❌ Error insertando partido ${fecha} ${categoria}:`, error.message);
      } else {
        console.log(`✅ Partido insertado: ${fecha} ${categoria} - ${resultado} ${propios}-${rival}`);
      }
    }
  }

  console.log('✅ Finalizado insertado de partidos.\n');
  return matches;
}

// ---------------------------------------------------------------------------
// 3. Helper: generar estadísticas aleatorias consistentes para una jugadora
// ---------------------------------------------------------------------------
function generarEstadisticasJugadora(config) {
  const stats = {};

  // Campos comunes a ambos deportes
  stats.tiempo_jugado = Math.min(config.labelPartido === 'Mitades' ? 90 : 60, randomInt(0, 90));

  // Estadísticas específicas por deporte
  config.acciones.forEach(accion => {
    if (accion.id === 'Gol') {
      stats.goles = randomInt(0, 5);
    } else if (accion.id.includes('Tarjeta')) {
      // Contar tarjetas
      const tipo = accion.id.includes('verde') ? 'verde' : accion.id.includes('amarilla') ? 'amarilla' : 'roja';
      stats[accion.id] = randomInt(0, 3);
    } else if (accion.id === 'Asistencia' || accion.id === 'Tiro al arco') {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Fuera de arco') {
      stats[accion.id] = randomInt(0, 4);
    } else if (accion.id === 'Falta') {
      stats[accion.id] = randomInt(0, 6);
    } else if (accion.id.includes('Corner')) {
      stats[accion.id] = randomInt(0, 4);
    } else if (accion.id === 'Penalti') {
      stats[accion.id] = randomInt(0, 2);
    } else if (accion.id.includes('recuperacion') || accion.id.includes('intercept')) {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Salida') {
      stats[accion.id] = randomInt(0, 3);
    } else if (accion.id === 'Gesto Bloqueo' || accion.id === 'Gesto Flick') {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id.includes('Salida Linea') || accion.id.includes('Salida X') || accion.id.includes('Salida al medio')) {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Pérdida') {
      stats[accion.id] = randomInt(0, 8);
    } else if (accion.id === 'Quite positivo' || accion.id === 'Quite negativo') {
      stats[accion.id] = randomInt(0, 6);
    } else if (accion.id === 'Recuperación') {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Falta recibida') {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Corto a Favor') {
      stats[accion.id] = randomInt(0, 5);
    } else if (accion.id === 'Corto en Contra') {
      stats[accion.id] = randomInt(0, 3);
    }
  });

  return stats;
}

// ---------------------------------------------------------------------------
// 4. Insertar estadísticas individual de jugadoras en 'resumen_jugadoras'
// ---------------------------------------------------------------------------
async function insertMockResumenJugadoras(matches) {
  console.log('🔄 Insertando estadísticas de jugadoras...');

  const config = obtenerConfigDeporteActual();

  for (const [categoria, players] of Object.entries(MOCK_PLAYERS_BY_CATEGORY)) {
    for (const match of matches) {
      if (match.categoria !== categoria) continue;

      // Elegir entre 3-5 jugadoras aleatorias de esta categoría para tener stats en este partido
      const numJugadoras = Math.floor(Math.random() * (players.length - 2)) + 2;
      const selectedPlayers = [];
      let shuffled = [...players].sort(() => 0.5 - Math.random());
      selectedPlayers.push(...shuffled.slice(0, numJugadoras));

      for (const jugadora of selectedPlayers) {
        const stats = generarEstadisticasJugadora(config);

        // Mapear las stats a los campos de la base de datos
        // Para hockey: usar nombres originales
        // Para fútbol: algunos campos se renombran
        const mapearCampo = (campoHockey) => {
          // Mapeo hockey → fútbol para campos que tienen nombres diferentes
          const mapeo = {
            'gesto_bloqueo': 'gesto_bloqueo', // hockey mantiene nombre
            'gesto_flick': 'gesto_flick', // hockey mantiene nombre
            'gesto_salida_linea': 'gesto_salida_linea', // hockey mantiene nombre
            'gesto_salida_x': 'gesto_salida_x', // hockey mantiene nombre
            'gesto_salida_al_medio': 'gesto_salida_al_medio', // hockey mantiene nombre
            'tarjeta_amarilla': 'tarjeta_amarilla',
            'tarjeta_roja': 'tarjeta_roja',
            'tarjeta_verde': 'tarjeta_verde',
            'quite_positivo': 'quite_positivo',
            'quite_negativo': 'quite_negativo',
            'recuperacion': 'recuperacion',
            'falta_recibida': 'falta_recibida',
            'corto_a_favor': 'corto_a_favor',
            'corto_en_contra': 'corto_en_contra',
            'tiro_al_arco': 'tiro_al_arco',
            'goles': 'goles',
            'tiempo_jugado': 'tiempo_jugado'
          };
          return mapeo[campoHockey] || campoHockey;
        };

        const campoFutbol = mapearCampo('');

        // Construir el objeto de stats para Supabase
        // El schema de resumen_jugadoras tiene campos fijos, así que construiremos según el deporte
        const individualStats = {
          partido_fecha: match.partido_fecha,
          categoria: categoria,
          jugadora_nombre: jugadora.nombre,
          tiempo_jugado: Math.min(60, stats.tiempo_jugado), // schema limita a 60
        };

        // Agregar campos deEstadísticas según el deporte
        // Hockey campos
        if (config.nombre.includes('Hockey')) {
          individualStats.goles = stats.goles;
          individualStats.gesto_bloqueo = stats.gesto_bloqueo;
          individualStats.gesto_flick = stats.gesto_flick;
          individualStats.gesto_salida_linea = stats.gesto_salida_linea;
          individualStats.gesto_salida_x = stats.gesto_salida_x;
          individualStats.gesto_salida_al_medio = stats.gesto_salida_al_medio;
          individualStats.tarjeta_amarilla = stats.tarjeta_amarilla;
          individualStats.tarjeta_roja = stats.tarjeta_roja;
          individualStats.tarjeta_verde = stats.tarjeta_verde;
          individualStats.quite_positivo = stats.quite_positivo;
          individualStats.quite_negativo = stats.quite_negativo;
          individualStats.recuperacion = stats.recuperacion;
          individualStats.falta_recibida = stats.falta_recibida;
          individualStats.corto_a_favor = stats.corto_a_favor;
          individualStats.corto_en_contra = stats.corto_en_contra;
          individualStats.tiro_al_arco = stats.tiro_al_arco;
        } else {
          // Fútbol campos
          individualStats.goles = stats.goles || 0;
          individualStats.asistencias = stats.asistencias || 0;
          individualStats.tiro_al_arco = stats.tiro_al_arco || 0;
          individualStats.tiro_fuera = stats.tiro_fuera || 0;
          individualStats.falta_cometida = stats.falta_cometida || 0;
          individualStats.tarjeta_amarilla = stats.tarjeta_amarilla || 0;
          individualStats.tarjeta_roja = stats.tarjeta_roja || 0;
          individualStats.corner_a_favor = stats.corner_a_favor || 0;
          individualStats.corner_en_contra = stats.corner_en_contra || 0;
          individualStats.penalti_convertido = stats.penalti_convertido || 0;
          individualStats.penaltiFallado = stats.penaltiFallado || 0;
          individualStats.recuperacion_balon = stats.recuperacion_balon || 0;
          individualStats.interceptaciones = stats.interceptaciones || 0;
        }

        const { error } = await supabase
          .from('resumen_jugadoras')
          .upsert(individualStats, {
            onConflict: 'partido_fecha,categoria,jugadora_nombre'
          });

        if (error) {
          console.error(`❌ Error insertando stats de ${jugadora.nombre}:`, error.message);
        } else {
          console.log(`✅ Stats insertadas: ${jugadora.nombre} (${match.partido_fecha} ${categoria})`);
        }
      }
    }
  }

  console.log('✅ Finalizado insertado de estadísticas de jugadoras.\n');
}

// ---------------------------------------------------------------------------
// 5. Insertar acciones mockeadas en 'acciones'
// ---------------------------------------------------------------------------
async function insertMockAcciones(matches) {
  console.log('🔄 Insertando acciones mockeadas...');

  const config = obtenerConfigDeporteActual();

  // Tipos de acciones basadas en la configuración del deporte
  const ACCION_TIPOS = config.acciones.map(a => a.id);

  // Zonas posibles (solo algunas acciones las tienen)
  const ZONAS = ['Defensa', 'Medio', 'Ataque'];

  for (const match of matches) {
    const categoria = match.categoria;
    const players = MOCK_PLAYERS_BY_CATEGORY[categoria] || [];

    // Número aleatorio de acciones por partido (entre 8 y 25)
    const numAcciones = randomInt(8, 25);

    for (let i = 0; i < numAcciones; i++) {
      // Elegir una jugadora aleatoria
      const jugadora = choose(players);
      // Elegir una acción aleatoria de las disponibles para este deporte
      const accionId = choose(ACCION_TIPOS);
      // Determinar si requiere zona (basado en la configuración)
      const accionConfig = config.acciones.find(a => a.id === accionId);
      const requiereZona = accionConfig ? accionConfig.zona : false;
      // Zona solo para algunas acciones
      const zona = requiereZona ? choose(ZONAS) : null;
      // Minuto aleatorio - hockey: 0-60, fútbol: 0-90
      const maxMinuto = config.labelPartido === 'Mitades' ? 90 : 60;
      const minuto = randomInt(0, maxMinuto);
      // Valor: 1 para la mayoría, o 0/2 según tipo
      const valor = accionId === 'Gol' ? 1 : randomInt(0, 2);

      const actionData = {
        partido_fecha: match.partido_fecha,
        categoria: categoria,
        jugadora_nombre: jugadora.nombre,
        accion_tipo: accionId,
        valor: valor,
        minuto: minuto,
        cuarto: choose(['Q1', 'Q2', 'Q3', 'Q4']),
        zona: zona
      };

      const { error } = await supabase.from('acciones').insert(actionData);

      if (error) {
        console.error(`❌ Error insertando acción:`, error.message);
      } else {
        // console.log(`✅ Acción: ${accionId} por ${jugadora.nombre} min ${minuto} ${match.partido_fecha}`);
      }
    }
  }

  console.log('✅ Finalizado insertado de acciones.\n');
}

// ---------------------------------------------------------------------------
// Ejecución principal
// ---------------------------------------------------------------------------
(async () => {
  try {
    console.log('🚀 Iniciando seed de datos mockeados a Supabase...\n');

    // 1. Jugadoras
    await insertMockJugadoras();

    // 2. Partidos (guardamos la respuesta para después)
    const matches = await insertMockPartidos();

    // 3. Estadísticas de jugadoras por partido
    await insertMockResumenJugadoras(matches);

    // 4. Acciones del partido
    await insertMockAcciones(matches);

    console.log('🎉 ¡Seed completado! Ya puedes usar la web app con datos de prueba.');
    console.log('\nResumen:');
    console.log('- Tabla `jugadoras`: registros por categoría 7ma_fem, 6ta_fem, 5ta_fem, 1ra_fem, 1ra_masc');
    console.log('- Tabla `resumen_partidos`: partidos distribuidos por fechas y categorías');
    console.log('- Tabla `resumen_jugadoras`: estadísticas individuales por jugador-partido');
    console.log('- Tabla `acciones`: historial de acciones (goles, quites, pérdidas, tarjetas, etc.)\n');
  } catch (err) {
    console.error('❌ Error general en el seed:', err);
    process.exit(1);
  }
})();