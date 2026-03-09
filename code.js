// code.js - Lógica Principal e Integración con Supabase
// --- VARIABLES GLOBALES ---
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
let countdownMode = false; // We keep false to count UP from 0 to 15
const QUARTER_TIME = 15 * 60 * 1000; // 15 minutes in ms

let golesPropios = 0;
let golesRival = 0;

let accionesRegistradas = []; // Row history objects
let estadisticasJuego = {}; // Acumulador p/ el final del partido
let tiempoJugado = {};
let tiempoEntrada = {};

let selectedPlayer = null;
let selectedSubstitute = null;
let selectedZone = null;

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
      { id: "Quite positivo", icon: "fa-hand-rock", color: "teal", zone: true },
      { id: "Quite negativo", icon: "fa-hand-paper", color: "red", zone: true },
      { id: "Recuperación", icon: "fa-redo-alt", color: "teal", zone: true },
      { id: "Corto en Contra", icon: "fa-minus-circle", color: "red" }
    ]
  },
  {
    cat: "Pérdidas", items: [
      { id: "Pérdida", icon: "fa-arrow-down", color: "red", zone: true }
    ]
  },
  {
    cat: "Infracciones", items: [
      { id: "Falta recibida", icon: "fa-handshake", color: "orange", zone: true },
      { id: "Falta cometida", icon: "fa-exclamation-triangle", color: "red", zone: true },
      { id: "Pie", icon: "fa-shoe-prints", color: "orange", zone: true }
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
  if (!supabaseClient) {
    console.error("Supabase no ha sido inicializado.");
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

  // Hide Setup, Show Match
  document.getElementById('section-setup').classList.remove('active');
  document.getElementById('section-match').classList.add('active');
  document.getElementById('current-stage-label').innerText = "Partido en Curso";
  document.getElementById('current-stage-label').classList.replace('text-brand-400', 'text-yellow-400');

  // Revert button just in case we were editing
  const btn = document.getElementById('btn-iniciar-partido');
  btn.innerText = "Iniciar Partido";
  btn.onclick = iniciarPartido;

  // Show header edit button
  const headerEditBtn = document.getElementById('btn-header-editar');
  if (headerEditBtn) headerEditBtn.classList.remove('hidden');
}

function editarAlineacion() {
  document.getElementById('section-match').classList.remove('active');
  document.getElementById('section-setup').classList.add('active');
  document.getElementById('current-stage-label').innerText = "Editando Alineación...";

  const btn = document.getElementById('btn-iniciar-partido');
  btn.innerText = "Guardar Cambios";
  btn.onclick = guardarEdicionAlineacion;

  // Hide header edit button
  const headerEditBtn = document.getElementById('btn-header-editar');
  if (headerEditBtn) headerEditBtn.classList.add('hidden');
}

function guardarEdicionAlineacion() {
  const nuevosTitulares = Array.from(document.querySelectorAll('.j-titular:checked')).map(cb => cb.value);
  const nuevosSuplentes = Array.from(document.querySelectorAll('.j-suplente:checked')).map(cb => cb.value);

  if (nuevosTitulares.length > 11) {
    alert(`Has seleccionado ${nuevosTitulares.length} titulares. El máximo es 11.`);
    return;
  }

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

  document.getElementById('section-setup').classList.remove('active');
  document.getElementById('section-match').classList.add('active');
  document.getElementById('current-stage-label').innerText = "Partido en Curso";

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
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-dashed border-gray-500 bg-transparent text-gray-400 hover:text-white hover:border-gray-300">
            <i class="fas fa-question-circle mr-1"></i> No id
        </button>
    `;
    Object.keys(playerStatus).forEach(j => {
      if (playerStatus[j] === "In_Field") {
        const btn = document.createElement('button');
        btn.className = "px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-gray-300";
        if (j === selectedPlayer) {
          btn.className = "px-3 py-2 bg-brand-500 border border-brand-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-brand-500/20";
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
        btn.className = "px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium hover:bg-white/10 transition-all text-gray-400";
        if (j === selectedSubstitute) {
          btn.className = "px-3 py-2 bg-purple-600 border border-purple-400 rounded-xl text-xs font-medium text-white shadow-lg shadow-purple-500/20";
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
    b.classList.remove('bg-brand-500', 'text-white', 'border-brand-400');
    b.classList.add('bg-black/30', 'text-gray-400', 'border-white/10');
  });

  const btnId = `zone-${zona.toLowerCase()}`;
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.replace('bg-black/30', 'bg-brand-500');
    btn.classList.replace('text-gray-400', 'text-white');
    btn.classList.replace('border-white/10', 'border-brand-400');
  }
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
    const remainingTime = Math.max(0, QUARTER_TIME - currentElapsedTime);
    minutes = Math.floor(remainingTime / 60000);
    seconds = Math.floor((remainingTime % 60000) / 1000);

    if (remainingTime === 0 && isRunning) {
      pauseTimer();
      alert("¡Fin del cuarto!");
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
    document.getElementById('icon-play-pause').className = "fas fa-play text-brand-400";
    document.getElementById('text-play-pause').innerText = "Reanudar";
    isRunning = false;
  }
}

function setQuarter(q) {
  if (isRunning) {
    alert("Pausa el cronómetro antes de cambiar de cuarto.");
    return;
  }

  if (!confirm(`¿Cambiar al cuarto ${q}? Esto guardará los tiempos jugados de este cuarto y reiniciará el cronómetro a 00:00.`)) {
    return;
  }

  // Cerrar el tiempo jugado de este cuarto para todas las que están en cancha
  const minCierreCuarto = obtenerMinutoActual();
  Object.keys(playerStatus).forEach(j => {
    if (playerStatus[j] === "In_Field") {
      const minEntró = tiempoEntrada[j] || 0;
      const dif = Math.max(0, minCierreCuarto - minEntró);
      tiempoJugado[j] = (tiempoJugado[j] || 0) + dif;
      // Su nuevo tiempo de entrada para el próximo cuarto es el minuto 0
      tiempoEntrada[j] = 0;
    }
  });

  cuartoActual = q;
  elapsedTime = 0;
  startTime = 0;
  updateStopwatchDisplay();

  // Actualizar UI botones
  document.querySelectorAll('#quarter-selector button').forEach(btn => {
    if (btn.getAttribute('data-q') === q) {
      btn.className = "px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-brand-500 text-white";
    } else {
      btn.className = "px-2 py-0.5 rounded text-[10px] font-bold transition-all text-gray-500 hover:text-white";
    }
  });
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

  // UX Shortcut: if only one item, select it automatically
  if (items.length === 1) {
    grid.innerHTML = `<p class="col-span-full text-center text-gray-400 text-xs py-10 italic">Acción "${items[0].id}" seleccionada automáticamente.</p>`;
    // We call selectAction but with a dummy element or we refactor selectAction to accept null for element
    selectAction(null, items[0]);
    return;
  }

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

    btn.className = `action-btn items-center text-center group ${colorClass}`;
    btn.innerHTML = `
            <i class="fas ${item.icon} text-2xl mb-1 opacity-70 group-hover:opacity-100 transition-opacity"></i>
            <span class="text-xs font-medium text-gray-300 leading-tight">${item.id}</span>
        `;

    btn.onclick = () => selectAction(btn, item);
    grid.appendChild(btn);
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
  if (action.zone) {
    zoneSel.classList.remove('hidden');
  } else {
    zoneSel.classList.add('hidden');
    selectedZone = null;
    document.querySelectorAll('#zone-selector button').forEach(b => {
      b.classList.remove('bg-brand-500', 'text-white', 'border-brand-400', 'shadow-lg', 'shadow-brand-500/20');
      b.classList.add('bg-black/40', 'text-gray-400', 'border-white/10');
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
    agregarLogUI(jugadora, `Sale ⬇️ (por ${suplente})`, "purple", minutoFormateado);
    agregarLogUI(suplente, `Entra ⬆️ (por ${jugadora})`, "green", minutoFormateado);

    selectedSubstitute = null;
    actualizarGrillaJugadoras();

  } else {
    // 2. Normal Actions Engine (Check Zone)
    const actionConfig = ACCIONES_CONFIG.flatMap(c => c.items).find(i => i.id === currentActionId);
    if (actionConfig && actionConfig.zone && !selectedZone) {
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
    b.classList.remove('bg-brand-500', 'text-white', 'border-brand-400', 'shadow-lg', 'shadow-brand-500/20');
    b.classList.add('bg-black/40', 'text-gray-400', 'border-white/10');
  });

  actualizarGrillaJugadoras();
  const minInp = document.getElementById('action-minuto');
  if (minInp) minInp.value = '';

  // Actualizar estadísticas en tiempo real
  actualizarEstadisticas();

  document.getElementById('action-overlay').classList.remove('hidden');
}

function switchTab(tab) {
  const btnFeed = document.getElementById('tab-btn-feed');
  const btnInsights = document.getElementById('tab-btn-insights');
  const contentFeed = document.getElementById('tab-content-feed');
  const contentInsights = document.getElementById('tab-content-insights');

  if (tab === 'feed') {
    btnFeed.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-brand-500 text-white shadow-lg";
    btnInsights.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-gray-400 hover:text-white";
    contentFeed.classList.remove('hidden');
    contentInsights.classList.add('hidden');
  } else {
    btnInsights.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-brand-500 text-white shadow-lg";
    btnFeed.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-gray-400 hover:text-white";
    contentInsights.classList.remove('hidden');
    contentFeed.classList.add('hidden');
    actualizarEstadisticas();
  }
}

function actualizarEstadisticas() {
  // 1. Efficiency / Ratios
  let recuperaciones = 0;
  let perdidas = 0;

  // 2. Exits Distribution
  const salidas = { linea: 0, x: 0, medio: 0 };

  // 3. Zones
  const perdidasZona = { "Defensa": 0, "Medio": 0, "Ataque": 0 };
  const robosZona = { "Defensa": 0, "Medio": 0, "Ataque": 0 };

  // 4. Quarters
  const qStats = {
    Q1: { goles: 0, cortos: 0, perdidas: 0 },
    Q2: { goles: 0, cortos: 0, perdidas: 0 },
    Q3: { goles: 0, cortos: 0, perdidas: 0 },
    Q4: { goles: 0, cortos: 0, perdidas: 0 }
  };

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

    // Quarter mapping
    if (a.cuarto && qStats[a.cuarto]) {
      if (a.accion === "Gol") qStats[a.cuarto].goles++;
      if (a.accion.includes("Corto a Favor")) qStats[a.cuarto].cortos++;
      if (a.accion === "Pérdida") qStats[a.cuarto].perdidas++;
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
    sTypes.forEach(t => document.getElementById(`bar-salida-${t}`).style.width = `33%`);
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

  // Update UI - Quarters
  const qRows = document.getElementById('q-stats-rows');
  qRows.innerHTML = '';
  ["Q1", "Q2", "Q3", "Q4"].forEach(q => {
    const s = qStats[q];
    const isCurrent = cuartoActual === q;
    qRows.innerHTML += `
      <div class="grid grid-cols-4 gap-1 py-1 border-b border-white/5 items-center ${isCurrent ? 'bg-white/5 rounded-lg -mx-1 px-1' : ''}">
        <span class="text-[10px] font-bold ${isCurrent ? 'text-brand-400' : 'text-gray-500'}">${q}</span>
        <span class="text-center text-xs font-mono text-white">${s.goles}</span>
        <span class="text-center text-xs font-mono text-white">${s.cortos}</span>
        <span class="text-center text-xs font-mono text-white">${s.perdidas}</span>
      </div>
    `;
  });
}

function determineColorForFeed(act) {
  if (act.includes('Gol')) return 'brand';
  if (act.includes('Gesto')) return 'blue';
  if (act.includes('Tarjeta roja') || act.includes('negativo') || act.includes('Perdida') || act.includes('Contra')) return 'red';
  if (act.includes('positiv') || act.includes('verde') || act.includes('Favor') || act.includes('Recuperación')) return 'green';
  return 'gray';
}

function agregarLogUI(nombre, accionTexto, colorTheme, minuto = null) {
  const feed = document.getElementById('tab-content-feed');
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
  const quarterStr = cuartoActual;

  const logHTML = `
        <div class="bg-black/20 p-3 rounded-xl border-l-4 ${tailwindBorderColor} shadow-sm animate-[fadeIn_0.3s_ease]">
            <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-white text-sm">${nombre}</span>
                <div class="flex gap-2">
                    <span class="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 rounded font-bold">${quarterStr}</span>
                    <span class="text-xs bg-white/10 px-2 rounded font-mono text-gray-300"><i class="far fa-clock mr-1"></i>${timeStr}</span>
                </div>
            </div>
            <span class="text-xs font-semibold uppercase tracking-wider ${tailwindTextColor}">${accionTexto}</span>
        </div>
    `;

  feed.insertAdjacentHTML('afterbegin', logHTML);
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
    if (accionesRegistradas.length > 0 && !accionesYaInsertadas) {
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
        accionesYaInsertadas = true;
      }
    }


    // 4. Transform individual stats to Supabase schema 'resumen_jugadoras'
    // Exclude anyone who was checked then fully unchecked during edits.
    const allPlayersInvolved = Object.keys(playerStatus).filter(j => playerStatus[j] !== "Removed");

    const individualStatsBatch = allPlayersInvolved.map(j => {
      const getA = (accion_exacta) => Number(estadisticasJuego[`${j}_${accion_exacta}`]) || 0;

      return {
        partido_fecha: fechaActual,
        categoria: categoriaActual,
        jugadora_nombre: j,
        tiempo_jugado: Math.round(Number(tiempoJugado[j])) || 0,
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
      }
    });

    const { error: errPData } = await supabaseClient
      .from('resumen_jugadoras')
      .upsert(individualStatsBatch, { onConflict: 'partido_fecha,categoria,jugadora_nombre' });

    if (errPData) throw errPData;

    // Success UI
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check bg-green-500 rounded-full w-6 h-6 inline-flex items-center justify-center text-black mr-2"></i> ¡Guardado Exitoso!`;
      btn.classList.replace('border-red-500/50', 'border-green-500');
      btn.classList.replace('text-red-400', 'text-green-400');
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

// --- EXPORTAR A WINDOW (Para Vite Modules) ---
window.cargarJugadoras = cargarJugadoras;
window.validateRosterSelection = validateRosterSelection;
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
