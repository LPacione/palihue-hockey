// code.js - Lógica Principal e Integración con Supabase
// --- VARIABLES GLOBALES ---
let supabaseClient = null;
let categoriaActual = "";
let fechaActual = "";

let jugadorasData = []; // Todas las jugadoras de la DB p/ la categoria
let titulares = []; // Nombres
let suplentes = []; // Nombres
let playerStatus = {}; // { "Nombre": "In_Field" | "On_Bench" }

let timerInterval;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

let golesPropios = 0;
let golesRival = 0;

let accionesRegistradas = []; // Row history objects
let estadisticasJuego = {}; // Acumulador p/ el final del partido
let tiempoJugado = {};
let tiempoEntrada = {};

// Configuración de Acciones (Botones rápidos)
const ACCIONES_CONFIG = [
  {
    cat: "Gestos", items: [
      { id: "Gesto Bloqueo", icon: "fa-shield-alt", color: "blue" },
      { id: "Gesto Flick", icon: "fa-hand-point-up", color: "blue" },
      { id: "Gesto Salida Linea", icon: "fa-ruler-horizontal", color: "blue" },
      { id: "Gesto Salida X", icon: "fa-times-circle", color: "blue" },
      { id: "Gesto Salida al medio", icon: "fa-arrows-alt-h", color: "blue" }
    ]
  },
  {
    cat: "Ofensiva", items: [
      { id: "Tiro al arco", icon: "fa-bullseye", color: "green" },
      { id: "Corto a Favor", icon: "fa-plus-circle", color: "green" },
      { id: "Gol", icon: "fa-futbol", color: "brand" }
    ]
  },
  {
    cat: "Defensiva", items: [
      { id: "Quite positivo", icon: "fa-hand-rock", color: "teal" },
      { id: "Quite negativo", icon: "fa-hand-paper", color: "red" },
      { id: "Recuperación", icon: "fa-redo-alt", color: "teal" },
      { id: "Corto en Contra", icon: "fa-minus-circle", color: "red" }
    ]
  },
  {
    cat: "Infracciones", items: [
      { id: "Falta recibida", icon: "fa-handshake", color: "orange" },
      { id: "Falta dentro del area", icon: "fa-exclamation-triangle", color: "red" },
      { id: "Falta fuera del area", icon: "fa-exclamation-circle", color: "orange" },
      { id: "Perdida antes de mitad de cancha", icon: "fa-arrow-left", color: "red" },
      { id: "Perdida antes de 23", icon: "fa-arrow-down", color: "red" },
      { id: "Perdida despues de 23", icon: "fa-arrow-right", color: "red" }
    ]
  },
  {
    cat: "Tarjetas", items: [
      { id: "Tarjeta verde", icon: "fa-square", color: "green", solid: true },
      { id: "Tarjeta amarilla", icon: "fa-square", color: "yellow", solid: true },
      { id: "Tarjeta roja", icon: "fa-square", color: "red", solid: true }
    ]
  },
  {
    cat: "Sustitución", items: [
      { id: "Salida", icon: "fa-exchange-alt", color: "purple" }
    ]
  }
];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Supabase Config
  checkSupabaseConfig();

  // 2. Set default option logic or simply leave empty
  // Not setting a default as user must select a tournament matchday

  // 3. Render Action Categories
  renderActionCategories();
});

function checkSupabaseConfig() {
  const envUrl = window.ENV?.SUPABASE_URL;
  const envKey = window.ENV?.SUPABASE_ANON_KEY;

  const url = envUrl || localStorage.getItem('supa_url');
  const key = envKey || localStorage.getItem('supa_key');

  if (!url || !key) {
    document.getElementById('setup-warning').classList.remove('hidden');
  } else {
    document.getElementById('setup-warning').classList.add('hidden');
    supabaseClient = window.supabase.createClient(url, key);

    // Populate inputs in settings modal just in case
    const inputUrl = document.getElementById('supa-url');
    const inputKey = document.getElementById('supa-key');
    if (inputUrl) inputUrl.value = url;
    if (inputKey) inputKey.value = key;
  }
}

function guardarSettings() {
  const url = document.getElementById('supa-url').value.trim();
  const key = document.getElementById('supa-key').value.trim();
  if (url && key) {
    localStorage.setItem('supa_url', url);
    localStorage.setItem('supa_key', key);
    checkSupabaseConfig();
    cerrarSettings();
  } else {
    alert("Ambos campos son obligatorios");
  }
}

function cerrarSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}


// --- FASE 1: CONFIGURACIÓN INICIAL ---
async function cargarJugadoras() {
  if (!supabaseClient) {
    alert("Configura Supabase primero (engranaje arriba a la derecha).");
    return;
  }

  categoriaActual = document.getElementById('setup-categoria').value;
  if (!categoriaActual) return;

  // Show loading
  const titList = document.getElementById('list-titulares');
  const supList = document.getElementById('list-suplentes');
  titList.innerHTML = '<p class="text-sm text-gray-400 italic"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</p>';
  supList.innerHTML = '<p class="text-sm text-gray-400 italic"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</p>';

  document.getElementById('roster-container').classList.remove('opacity-50', 'pointer-events-none');

  try {
    const { data, error } = await supabaseClient
      .from('jugadoras')
      .select('nombre')
      .or(`categoria.eq.${categoriaActual},categoria_segunda.eq.${categoriaActual}`)
      .order('nombre', { ascending: true });

    if (error) throw error;

    jugadorasData = data || [];

    renderRosterSelection(jugadorasData);

  } catch (err) {
    console.error("Error al cargar jugadoras:", err);
    titList.innerHTML = '<p class="text-sm text-red-500 italic">Error de conexión con DB.</p>';
    supList.innerHTML = '';
  }
}

function renderRosterSelection(jugadoras) {
  const titList = document.getElementById('list-titulares');
  const supList = document.getElementById('list-suplentes');

  titList.innerHTML = '';
  supList.innerHTML = '';

  if (jugadoras.length === 0) {
    titList.innerHTML = '<p class="text-sm text-orange-400 italic">No hay jugadoras en esta categoría.</p>';
    return;
  }

  jugadoras.forEach((j, i) => {
    const htmlTitular = `
            <label class="custom-checkbox flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" value="${j.nombre}" class="hidden j-titular" onchange="validateRosterSelection(this, 'titular')">
                <div class="w-5 h-5 rounded border border-white/20 flex items-center justify-center bg-black/20 transition-all">
                    <svg class="w-3 h-3 text-white opacity-0 transform scale-50 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span class="text-sm select-none">${j.nombre}</span>
            </label>`;
    titList.insertAdjacentHTML('beforeend', htmlTitular);

    const htmlSuplente = `
            <label class="custom-checkbox flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" value="${j.nombre}" class="hidden j-suplente" onchange="validateRosterSelection(this, 'suplente')">
                <div class="w-5 h-5 rounded border border-white/20 flex items-center justify-center bg-black/20 transition-all">
                    <svg class="w-3 h-3 text-white opacity-0 transform scale-50 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span class="text-sm select-none">${j.nombre}</span>
            </label>`;
    supList.insertAdjacentHTML('beforeend', htmlSuplente);
  });
}

function validateRosterSelection(checkbox, tipo) {
  const nombre = checkbox.value;

  // Si se marca titular, desmarcar suplente y viceversa
  if (checkbox.checked) {
    if (tipo === 'titular') {
      const opp = document.querySelector(`.j-suplente[value="${nombre}"]`);
      if (opp) opp.checked = false;
    } else {
      const opp = document.querySelector(`.j-titular[value="${nombre}"]`);
      if (opp) opp.checked = false;
    }
  }

  actualizarContadoresSeleccion();
}

function actualizarContadoresSeleccion() {
  const countTit = document.querySelectorAll('.j-titular:checked').length;
  const countSup = document.querySelectorAll('.j-suplente:checked').length;

  document.getElementById('count-titulares').innerText = countTit;
  document.getElementById('count-suplentes').innerText = countSup;

  const btn = document.getElementById('btn-iniciar-partido');
  if (countTit > 0 || countSup > 0) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}

function iniciarPartido() {
  fechaActual = document.getElementById('setup-fecha').value;
  if (!fechaActual) {
    alert("Indica la fecha.");
    return;
  }

  titulares = Array.from(document.querySelectorAll('.j-titular:checked')).map(cb => cb.value);
  suplentes = Array.from(document.querySelectorAll('.j-suplente:checked')).map(cb => cb.value);

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

  // Populate "Who" dropdown
  actualizarDropdownJugadorasCampo();

  // Hide Setup, Show Match
  document.getElementById('section-setup').classList.remove('active');
  document.getElementById('section-match').classList.add('active');
  document.getElementById('current-stage-label').innerText = "Partido en Curso";
  document.getElementById('current-stage-label').classList.replace('text-brand-400', 'text-yellow-400');
}

// --- FASE 2: TABLERO Y ACCIONES ---

// > Cronómetro
const stopwatchDisplay = document.getElementById('stopwatchDisplay');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');

function updateStopwatchDisplay() {
  const now = Date.now();
  const currentElapsedTime = isRunning ? elapsedTime + (now - startTime) : elapsedTime;
  const minutes = Math.floor(currentElapsedTime / 60000);
  const seconds = Math.floor((currentElapsedTime % 60000) / 1000);
  stopwatchDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Auto-update action minute input
  if (!document.getElementById('action-minuto').value) {
    document.getElementById('action-minuto').placeholder = minutes;
  }
}

startStopBtn.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    document.getElementById('icon-play-pause').className = "fas fa-play text-brand-400";
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
    document.getElementById('icon-play-pause').className = "fas fa-play text-brand-400";
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

function actualizarDropdownJugadorasCampo() {
  const sel = document.getElementById('action-jugadora');
  sel.innerHTML = '<option value="" disabled selected>Seleccionar jugadora en campo...</option>';

  // Update badge 
  const badge = document.getElementById('quien-selected-badge');
  badge.classList.add('hidden');

  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "In_Field") {
      sel.innerHTML += `<option value="${j}">${j}</option>`;
    }
  });

  sel.addEventListener('change', (e) => {
    if (e.target.value) {
      badge.innerText = e.target.value;
      badge.classList.remove('hidden');
      document.getElementById('action-overlay').classList.add('hidden');
    }
  });

  // Populate Subs
  const selEntra = document.getElementById('action-quien-entra');
  selEntra.innerHTML = '<option value="" disabled selected>Seleccionar suplente en banco...</option>';
  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "On_Bench") {
      selEntra.innerHTML += `<option value="${j}">${j}</option>`;
    }
  });
}

function renderActionCategories() {
  const catContainer = document.getElementById('action-categories');
  catContainer.innerHTML = '';

  ACCIONES_CONFIG.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className = `px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${index === 0 ? 'bg-white/20 text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10'}`;
    btn.innerText = cat.cat;
    btn.onclick = () => {
      // Unify styles
      Array.from(catContainer.children).forEach(c => {
        c.className = 'px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap bg-transparent text-gray-400 hover:text-white hover:bg-white/10';
      });
      btn.className = 'px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap bg-white/20 text-white';
      renderActionsGrid(index);
    };
    catContainer.appendChild(btn);
  });

  // Initial render
  renderActionsGrid(0);
}

function renderActionsGrid(catIndex) {
  const grid = document.getElementById('action-buttons-grid');
  grid.innerHTML = '';

  const items = ACCIONES_CONFIG[catIndex].items;

  items.forEach(item => {
    const btn = document.createElement('div');
    // Handle Tailwind dynamic colors properly via safe classes
    let colorClass = 'text-blue-400';
    if (item.color === 'green') colorClass = 'text-green-400';
    if (item.color === 'red') colorClass = 'text-red-400';
    if (item.color === 'orange') colorClass = 'text-orange-400';
    if (item.color === 'teal') colorClass = 'text-teal-400';
    if (item.color === 'brand') colorClass = 'text-brand-400';
    if (item.color === 'yellow') colorClass = 'text-yellow-400';
    if (item.color === 'purple') colorClass = 'text-purple-400';

    let iconType = item.solid ? 'fas' : 'fas'; // Or 'far' for outlined usually, keeping fas

    btn.className = `action-btn items-center text-center group ${colorClass}`;
    btn.innerHTML = `
            <i class="${iconType} ${item.icon} text-2xl mb-1 opacity-70 group-hover:opacity-100 transition-opacity"></i>
            <span class="text-xs font-medium text-gray-300 leading-tight">${item.id}</span>
        `;

    btn.onclick = () => selectAction(btn, item.id);
    grid.appendChild(btn);
  });
}

function selectAction(btnElement, actionId) {
  // UI Reset
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');

  currentActionId = actionId;

  // Enable Save logic
  const saveBtn = document.getElementById('btn-save-action');
  saveBtn.classList.remove('opacity-50', 'pointer-events-none');

  // Show extra fields if Substitution
  const extraFields = document.getElementById('extra-sub-fields');
  if (actionId === 'Salida') {
    extraFields.classList.remove('hidden');
  } else {
    extraFields.classList.add('hidden');
  }
}

function guardarAccionActual() {
  const jugadoraList = document.getElementById('action-jugadora');
  const jugadora = jugadoraList.value;

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
    const suplente = document.getElementById('action-quien-entra').value;
    if (!suplente) {
      alert("Para una sustitución debes seleccionar quién entra desde la banca.");
      return;
    }

    // Logic
    playerStatus[jugadora] = "On_Bench";
    playerStatus[suplente] = "In_Field";

    // Tiempos
    const tiempoJugadoraQueEstuvo = Math.max(0, minutoFormateado - (tiempoEntrada[jugadora] || 0));
    tiempoJugado[jugadora] = (tiempoJugado[jugadora] || 0) + tiempoJugadoraQueEstuvo;

    tiempoEntrada[suplente] = minutoFormateado;

    // Register action records for history
    accionesRegistradas.push({ jugadora, accion: "Sale minuto", minuto: minutoFormateado });
    accionesRegistradas.push({ jugadora: suplente, accion: "Entra minuto", minuto: minutoFormateado });

    // Visual Feed
    agregarLogUI(jugadora, `Sale ⬇️ (por ${suplente})`, "purple", minutoFormateado);
    agregarLogUI(suplente, `Entra ⬆️ (por ${jugadora})`, "green", minutoFormateado);

    // Update dropdowns
    actualizarDropdownJugadorasCampo();

  } else {
    // 2. Normal Actions Engine
    if (currentActionId === 'Gol') {
      cambiarGol('propios', 1);
    }

    accionesRegistradas.push({ jugadora, accion: currentActionId, valor: 1, minuto: minutoFormateado });

    // Add to statistics aggregator map
    const key = jugadora + "_" + currentActionId;
    estadisticasJuego[key] = (estadisticasJuego[key] || 0) + 1;

    // Visual Feed
    agregarLogUI(jugadora, currentActionId, determineColorForFeed(currentActionId), minutoFormateado);
  }

  // Reset Forms
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
  currentActionId = null;
  document.getElementById('btn-save-action').classList.add('opacity-50', 'pointer-events-none');
  document.getElementById('extra-sub-fields').classList.add('hidden');

  const badge = document.getElementById('quien-selected-badge');
  badge.classList.add('hidden');
  jugadoraList.value = "";
  document.getElementById('action-overlay').classList.remove('hidden');
}

function determineColorForFeed(act) {
  if (act.includes('Gol')) return 'brand';
  if (act.includes('Gesto')) return 'blue';
  if (act.includes('Tarjeta roja') || act.includes('negativo') || act.includes('Perdida')) return 'red';
  if (act.includes('positiv') || act.includes('verde')) return 'green';
  return 'gray';
}

function agregarLogUI(nombre, accionTexto, colorTheme, minuto = null) {
  const feed = document.getElementById('actions-feed');
  // Remove "empty" message if exists
  if (feed.children.length === 1 && feed.children[0].tagName === 'P') {
    feed.innerHTML = '';
  }

  let tailwindBorderColor = 'border-gray-500';
  let tailwindTextColor = 'text-gray-300';

  if (colorTheme === 'brand') { tailwindBorderColor = 'border-brand-500'; tailwindTextColor = 'text-brand-300'; }
  if (colorTheme === 'blue') { tailwindBorderColor = 'border-blue-500'; tailwindTextColor = 'text-blue-300'; }
  if (colorTheme === 'red') { tailwindBorderColor = 'border-red-500'; tailwindTextColor = 'text-red-300'; }
  if (colorTheme === 'green') { tailwindBorderColor = 'border-green-500'; tailwindTextColor = 'text-green-300'; }
  if (colorTheme === 'purple') { tailwindBorderColor = 'border-purple-500'; tailwindTextColor = 'text-purple-400'; }

  const timeStr = minuto ? `${minuto}'` : obtenerMinutoActual() + "'";

  const logHTML = `
        <div class="bg-black/20 p-3 rounded-xl border-l-4 ${tailwindBorderColor} shadow-sm animate-[fadeIn_0.3s_ease]">
            <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-white text-sm">${nombre}</span>
                <span class="text-xs bg-white/10 px-2 rounded font-mono text-gray-300"><i class="far fa-clock mr-1"></i>${timeStr}</span>
            </div>
            <span class="text-xs font-semibold uppercase tracking-wider ${tailwindTextColor}">${accionTexto}</span>
        </div>
    `;

  feed.insertAdjacentHTML('afterbegin', logHTML);
}

// --- FASE 3: FINALIZAR PARTIDO (Guardado 100% Client-Side vía Supabase) ---

async function finalizarPartido() {
  if (!supabaseClient) {
    alert("Sin conexión a Supabase configurada."); return;
  }
  if (!confirm("¿Estás seguro que deseas finalizar el partido? Esto calculará los tiempos y enviará la info a la base de datos.")) {
    return;
  }

  // 1. Terminar de calcular tiempo jugado para las que están actualmente en campo
  const minCierre = obtenerMinutoActual();
  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "In_Field") {
      const minEntró = tiempoEntrada[j] || 0;
      const dif = Math.max(0, minCierre - minEntró);
      tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
    }
  });

  const btn = event.currentTarget;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...`;
  btn.disabled = true;

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
    if (accionesRegistradas.length > 0) {
      const dbActions = accionesRegistradas.map(a => ({
        partido_fecha: fechaActual,
        categoria: categoriaActual,
        jugadora_nombre: a.jugadora,
        accion_tipo: a.accion,
        valor: a.valor || 1,
        minuto: a.minuto
      }));

      const { error: errAct } = await supabaseClient.from('acciones').insert(dbActions);
      if (errAct) console.warn("Error insertando acciones crudas. Omitido.", errAct);
    }

    // 4. Transform individual stats to Supabase schema 'resumen_jugadoras'
    const allPlayersInvolved = Object.keys(playerStatus); // Anyone who was Tit or Sub

    const individualStatsBatch = allPlayersInvolved.map(j => {
      const getA = (accion_exacta) => estadisticasJuego[`${j}_${accion_exacta}`] || 0;

      return {
        partido_fecha: fechaActual,
        categoria: categoriaActual,
        jugadora_nombre: j,
        tiempo_jugado: Math.round(tiempoJugado[j] || 0),
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
        falta_dentro_area: getA("Falta dentro del area"),
        falta_fuera_area: getA("Falta fuera del area"),
        falta_recibida: getA("Falta recibida"),
        perdida_antes_mitad_cancha: getA("Perdida antes de mitad de cancha"),
        perdida_antes_23: getA("Perdida antes de 23"),
        perdida_despues_23: getA("Perdida despues de 23"),
        corto_a_favor: getA("Corto a Favor"),
        corto_en_contra: getA("Corto en Contra"),
        tiro_al_arco: getA("Tiro al arco")
      }
    });

    // Insert / Upsert Individual Batch
    const { error: errPData } = await supabaseClient
      .from('resumen_jugadoras')
      .upsert(individualStatsBatch, { onConflict: 'partido_fecha,categoria,jugadora_nombre' });

    if (errPData) throw errPData;

    // Success UI
    btn.innerHTML = `<i class="fas fa-check bg-green-500 rounded-full w-6 h-6 inline-flex items-center justify-center text-black mr-2"></i> ¡Guardado Exitoso!`;
    btn.classList.replace('border-red-500/50', 'border-green-500');
    btn.classList.replace('text-red-400', 'text-green-400');

    setTimeout(() => {
      alert("El partido fue guardado exitosamente.");
      location.reload();
    }, 1500);

  } catch (e) {
    console.error("Error Guardando en Supabase: ", e);
    btn.innerHTML = `<i class="fas fa-times mr-2"></i> Error. Revisa consola.`;
    btn.disabled = false;
    alert("Hubo un error al guardar en la Base de Datos. Detalles en la consola F12.");
  }
}
