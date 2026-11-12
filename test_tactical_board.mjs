import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5174/';
const OUT = 'C:\\Users\\Trabajo\\AppData\\Local\\Temp\\opencode';

const errors = [];
const results = [];

function check(name, condition, detail = '') {
  results.push({ name, ok: !!condition, detail });
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${name}${detail ? ` :: ${detail}` : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  defaultViewport: { width: 430, height: 932 }
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  async function setSport(sport) {
    await page.evaluateOnNewDocument((s) => {
      localStorage.setItem('palihue_deporte', s);
      localStorage.setItem('palihue_deporte_explicita', 'true');
    }, sport);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('#sport-selector.hidden', { timeout: 15000 });
  }

  async function loadCategory(cat) {
    await page.select('#setup-categoria', cat);
    // La pizarra táctica vive en la pestaña "Táctica": hay que abrirla para que el
    // canvas tome medidas reales (el tab oculto daría tamaño 0).
    await page.click('.main-tab[data-tab="tactica"]');
    await page.waitForFunction(() => {
      const c = document.getElementById('tactical-board-container');
      return c && c.querySelector('canvas') && c.querySelector('canvas').width > 100;
    }, { timeout: 30000 });
    // esperar a que termine el render y la validación
    await new Promise(r => setTimeout(r, 800));
  }

  // ---------- HOCKEY ----------
  await setSport('hockey');
  check('Selector de deporte oculto con elección guardada',
    await page.$eval('#sport-selector', el => el.classList.contains('hidden')));

  await loadCategory('7ma_fem');

  const hockeyInfo = await page.evaluate(() => {
    const canvas = document.querySelector('#tactical-board-container canvas');
    return {
      canvasW: canvas.width,
      canvasH: canvas.height,
      cssW: canvas.getBoundingClientRect().width,
      cssH: canvas.getBoundingClientRect().height,
      validation: document.getElementById('validation-count').textContent.trim(),
      validationText: document.getElementById('validation-text').textContent.trim(),
      legend: document.getElementById('position-legend').children.length,
      legendText: document.getElementById('position-legend').innerText,
      schemas: Array.from(document.querySelectorAll('#tactical-schema-selector button')).map(b => b.textContent.trim()),
      btnDisabled: document.getElementById('btn-iniciar-partido').disabled,
      titularesChecks: window.getTacticalState().asignadas
    };
  });

  check('Hockey: cancha Konva renderizada', hockeyInfo.canvasW > 100 && hockeyInfo.canvasH > 100,
    `${hockeyInfo.canvasW}x${hockeyInfo.canvasH} (css ${Math.round(hockeyInfo.cssW)}x${Math.round(hockeyInfo.cssH)})`);
  const hockeyRatio = hockeyInfo.cssW / hockeyInfo.cssH;
  check('Hockey: proporción real 55/91,4', Math.abs(hockeyRatio - 55 / 91.4) < 0.03,
    hockeyRatio.toFixed(3));
  check('Hockey: 4 esquemas disponibles', hockeyInfo.schemas.length === 4, hockeyInfo.schemas.join(' | '));
  check('Hockey: 11 fichas en leyenda', hockeyInfo.legend === 11, String(hockeyInfo.legend));
  check('Hockey: validación 11/11', hockeyInfo.validation === '11/11', hockeyInfo.validationText);
  check('Hockey: botón iniciar habilitado', hockeyInfo.btnDisabled === false);
  check('Hockey: 11 titulares asignados en la pizarra', hockeyInfo.titularesChecks === 11, String(hockeyInfo.titularesChecks));

  await page.evaluate(() => document.getElementById('tactical-board-section').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'tactical-hockey-mobile.png'), fullPage: false });

  // Tocar la ficha del arquero (x=50%, y=8%)
  const gkPoint = await page.evaluate(() => {
    const canvas = document.querySelector('#tactical-board-container canvas');
    const r = canvas.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.08 };
  });
  await page.mouse.click(gkPoint.x, gkPoint.y);
  await new Promise(r => setTimeout(r, 400));

  const modalOpened = await page.$eval('#tactical-player-modal', el => !el.classList.contains('hidden'));
  check('Hockey: tap en ficha abre modal de jugadoras', modalOpened);

  const modalInfo = await page.evaluate(() => ({
    title: document.getElementById('modal-position-title').innerText.trim(),
    players: document.querySelectorAll('#modal-player-list button').length,
    circulo: document.getElementById('modal-player-list').innerText
  }));
  check('Hockey: modal lista la plantilla (12)', modalInfo.players === 12, `${modalInfo.players} · ${modalInfo.title}`);

  // Intercambiar con la segunda jugadora (ya asignada en otra posición)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#modal-player-list button'));
    const target = buttons.find(b => b.innerText.includes('María López'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const afterSwap = await page.evaluate(() => ({
    modalHidden: document.getElementById('tactical-player-modal').classList.contains('hidden'),
    validation: document.getElementById('validation-count').textContent.trim(),
    btnDisabled: document.getElementById('btn-iniciar-partido').disabled,
    legend: document.getElementById('position-legend').innerText,
    titulares: window.getTacticalState().asignadas
  }));
  check('Hockey: modal se cierra al asignar', afterSwap.modalHidden);
  check('Hockey: intercambio mantiene 11/11', afterSwap.validation === '11/11', afterSwap.validation);
  check('Hockey: arquero ahora es María L.', afterSwap.legend.includes('María L.'), afterSwap.legend.slice(0, 90));
  check('Hockey: el once sigue completo tras el intercambio', afterSwap.titulares === 11, String(afterSwap.titulares));

  // Cambiar esquema táctico
  await page.evaluate(() => window.selectTacticalSchema('3-3-3-1'));
  await new Promise(r => setTimeout(r, 500));
  const afterSchema = await page.evaluate(() => ({
    validation: document.getElementById('validation-count').textContent.trim(),
    legend: document.getElementById('position-legend').children.length,
    hint: document.getElementById('schema-hint').innerText,
    active: Array.from(document.querySelectorAll('#tactical-schema-selector button')).find(b => b.className.includes('active'))?.innerText,
    nodos: window.getTacticalState().nodos,
    total: window.getTacticalState().total
  }));
  check('Hockey: cambio a 3-3-3-1 mantiene 11 posiciones', afterSchema.legend === 11 && afterSchema.validation === '11/11', afterSchema.validation);
  check('Hockey: esquema activo marcado', (afterSchema.active || '').includes('3-3-3-1'), afterSchema.active);
  check('Hockey: hint actualizado', afterSchema.hint.includes('3 defensas'), afterSchema.hint);
  check('Hockey: sin fichas fantasma tras cambiar esquema', afterSchema.nodos === 11, `nodos=${afterSchema.nodos} total=${afterSchema.total}`);

  await page.evaluate(() => document.getElementById('tactical-board-section').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, 'tactical-hockey-3331.png'), fullPage: false });

  // Simular arrastre de la punta (x=50%, y=82%)
  const dragInfo = await page.evaluate(() => {
    const canvas = document.querySelector('#tactical-board-container canvas');
    const r = canvas.getBoundingClientRect();
    return { start: { x: r.left + r.width * 0.5, y: r.top + r.height * 0.82 } };
  });
  const antesDrag = await page.evaluate(() => window.getTacticalState().posiciones.find(p => p.id === 'PUNTA'));
  await page.mouse.move(dragInfo.start.x, dragInfo.start.y);
  await page.mouse.down();
  await page.mouse.move(dragInfo.start.x + 40, dragInfo.start.y - 60, { steps: 12 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 400));
  const despuesDrag = await page.evaluate(() => window.getTacticalState().posiciones.find(p => p.id === 'PUNTA'));
  check('Hockey: arrastre actualiza coordenadas X/Y en %',
    despuesDrag && Math.abs(despuesDrag.y - antesDrag.y) > 5 && despuesDrag.x > antesDrag.x,
    `antes (${antesDrag.x}, ${antesDrag.y}) → después (${despuesDrag.x}, ${despuesDrag.y})`);
  check('Hockey: arrastre no rompe la validación', await page.evaluate(() => document.getElementById('validation-count').textContent.trim() === '11/11'));

  // ---------- FÚTBOL ----------
  await setSport('futbol');
  await loadCategory('7ma_fem');

  const futbolInfo = await page.evaluate(() => ({
    schemas: Array.from(document.querySelectorAll('#tactical-schema-selector button')).map(b => b.textContent.trim()),
    validation: document.getElementById('validation-count').textContent.trim(),
    active: Array.from(document.querySelectorAll('#tactical-schema-selector button')).find(b => b.className.includes('active'))?.innerText,
    legend: document.getElementById('position-legend').innerText,
    canvasW: document.querySelector('#tactical-board-container canvas').width,
    canvasH: document.querySelector('#tactical-board-container canvas').height
  }));
  check('Fútbol: 4 esquemas disponibles', futbolInfo.schemas.length === 4, futbolInfo.schemas.join(' | '));
  check('Fútbol: esquema por defecto 4-4-2', (futbolInfo.active || '').includes('4-4-2'), futbolInfo.active);
  check('Fútbol: validación 11/11', futbolInfo.validation === '11/11', futbolInfo.validation);
  const futbolRatio = futbolInfo.canvasW / futbolInfo.canvasH;
  check('Fútbol: proporción 68/100', Math.abs(futbolRatio - 0.68) < 0.03, futbolRatio.toFixed(3));
  check('Fútbol: portero y laterales en leyenda', futbolInfo.legend.includes('POR') && futbolInfo.legend.includes('LI'), futbolInfo.legend.slice(0, 90));

  await page.evaluate(() => document.getElementById('tactical-board-section').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'tactical-futbol-mobile.png'), fullPage: false });

  // Desktop
  await page.setViewport({ width: 1280, height: 1000 });
  await new Promise(r => setTimeout(r, 800));
  const desktopSize = await page.evaluate(() => {
    const c = document.querySelector('#tactical-board-container canvas');
    const r = c.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), cw: c.width, ch: c.height };
  });
  check('Desktop: cancha responsive <= 540px de ancho', desktopSize.w <= 541, `${desktopSize.w}x${desktopSize.h}`);
  await page.evaluate(() => document.getElementById('tactical-board-section').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, 'tactical-futbol-desktop.png'), fullPage: false });

  // Errores de consola relevantes
  const relevantErrors = errors.filter(e => !/favicon|manifest|sw\.js|net::ERR|Failed to load resource|Variables de entorno para Supabase/i.test(e));
  check('Sin errores JS en consola', relevantErrors.length === 0, relevantErrors.slice(0, 4).join(' || '));

  console.log('\nRESUMEN:', results.filter(r => r.ok).length + '/' + results.length, 'checks OK');
  if (errors.length) console.log('\nErrores capturados:\n' + errors.join('\n'));
} finally {
  await browser.close();
}
