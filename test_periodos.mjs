import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5174/';

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
    await page.waitForFunction(() => {
      const c = document.getElementById('tactical-board-container');
      return c && c.querySelector('canvas') && c.querySelector('canvas').width > 100;
    }, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));
  }

  const readPeriodUI = () => page.evaluate(() => ({
    periods: Array.from(document.querySelectorAll('#quarter-selector button')).map(b => b.textContent.trim()),
    selectorLabel: document.getElementById('period-selector-label')?.innerText.trim(),
    duration: document.getElementById('period-duration-label')?.innerText.trim(),
    comparison: document.getElementById('period-comparison-title')?.innerText.trim(),
    statLabel: document.getElementById('period-stat-label')?.innerText.trim(),
    categories: Array.from(document.querySelectorAll('#action-categories button')).map(b => b.innerText.trim()),
    actions: Array.from(document.querySelectorAll('#action-buttons-grid .action-btn span')).map(s => s.innerText.trim()),
    thirdLabel: document.getElementById('period-third-label')?.innerText.trim(),
    recoveryTitle: document.getElementById('zones-recovery-title')?.innerText.trim(),
    exitVisible: !document.getElementById('exit-distribution-section').classList.contains('hidden'),
    ratioVisible: !document.getElementById('ratio-card').classList.contains('hidden'),
    lossZonesVisible: !document.getElementById('loss-zones-section').classList.contains('hidden')
  }));

  // ---------- HOCKEY ----------
  await setSport('hockey');
  await loadCategory('7ma_fem');

  let ui = await readPeriodUI();
  check('Hockey: períodos Q1-Q4', ui.periods.join(',') === 'Q1,Q2,Q3,Q4', ui.periods.join(' | '));
  check('Hockey: label de períodos', ui.selectorLabel === 'Cuartos', ui.selectorLabel);
  check('Hockey: duración 15\' por cuarto', /15'/.test(ui.duration) && /cuarto/i.test(ui.duration), ui.duration);
  check('Hockey: comparativa Cuartos', /Cuartos/.test(ui.comparison || ''), ui.comparison);
  check('Hockey: columna CORTOS', ui.statLabel === 'CORTOS', ui.statLabel);
  check('Hockey: categoría Gestos presente', ui.categories.includes('Gestos'), ui.categories.join(' | '));
  await page.evaluate(() => {
    const gestos = Array.from(document.querySelectorAll('#action-categories button'))
      .find(b => b.innerText.trim() === 'Gestos');
    gestos?.click();
  });
  await new Promise(r => setTimeout(r, 200));
  const gestureActions = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#action-buttons-grid .action-btn span')).map(s => s.innerText.trim()));
  check('Hockey: acciones de gestos al elegir categoría',
    gestureActions.some(a => a.includes('Gesto')), gestureActions.slice(0, 4).join(' | '));
  check('Hockey: Distribución de Salidas visible', ui.exitVisible === true);
  check('Hockey: tercera columna PÉRD.', ui.thirdLabel === 'PÉRD.', ui.thirdLabel);
  check('Hockey: ratio y pérdidas por zona visibles', ui.ratioVisible && ui.lossZonesVisible);
  check('Hockey: título "Robos por Zona"', ui.recoveryTitle === 'Robos por Zona', ui.recoveryTitle);

  // ---------- FÚTBOL ----------
  await setSport('futbol');
  await loadCategory('7ma_fem');

  ui = await readPeriodUI();
  check('Fútbol: períodos 1T y 2T', ui.periods.join(',') === '1T,2T', ui.periods.join(' | '));
  check('Fútbol: label de períodos', ui.selectorLabel === 'Mitades', ui.selectorLabel);
  check('Fútbol: duración 45\' por tiempo', /45'/.test(ui.duration) && /tiempo/i.test(ui.duration), ui.duration);
  check('Fútbol: comparativa Mitades', /Mitades/.test(ui.comparison || ''), ui.comparison);
  check('Fútbol: columna CÓRNERS', ui.statLabel === 'CÓRNERS', ui.statLabel);
  check('Fútbol: sin categoría Gestos', !ui.categories.includes('Gestos'), ui.categories.join(' | '));
  check('Fútbol: acciones propias (Asistencia/Penalti)',
    ui.actions.some(a => /Asistencia|Penalti/i.test(a)), ui.actions.slice(0, 6).join(' | '));
  check('Fútbol: Distribución de Salidas oculta', ui.exitVisible === false);
  check('Fútbol: tercera columna TIROS', ui.thirdLabel === 'TIROS', ui.thirdLabel);
  check('Fútbol: ratio y pérdidas por zona ocultas', !ui.ratioVisible && !ui.lossZonesVisible);
  check('Fútbol: título "Recuperaciones por Zona"', ui.recoveryTitle === 'Recuperaciones por Zona', ui.recoveryTitle);

  // ---------- FÚTBOL: jugar un 2T y registrar acción ----------
  const matchState = await page.evaluate(async () => {
    window.confirm = () => true;
    window.alert = () => {};
    const fecha = document.getElementById('setup-fecha');
    fecha.value = 'Fecha 1';
    window.iniciarPartido();
    await new Promise(r => setTimeout(r, 300));

    // Avanzar al segundo tiempo
    const btn2T = Array.from(document.querySelectorAll('#quarter-selector button'))
      .find(b => b.textContent.trim() === '2T');
    btn2T.click();
    await new Promise(r => setTimeout(r, 200));

    const activePeriod = Array.from(document.querySelectorAll('#quarter-selector button'))
      .find(b => b.className.includes('bg-brand-500'))?.textContent.trim();

    // Registrar gol en el período activo
    window.selectAction(null, { id: 'Gol', zona: false });
    const playerBtn = document.querySelector('#players-in-field-grid button:not(:first-child)');
    if (playerBtn) playerBtn.click();
    window.guardarAccionActual();
    await new Promise(r => setTimeout(r, 200));

    window.switchTab('insights');
    await new Promise(r => setTimeout(r, 200));

    return {
      activePeriod,
      matchVisible: document.getElementById('section-match').classList.contains('active'),
      feedBadges: Array.from(document.querySelectorAll('#tab-content-feed > div span'))
        .map(s => s.textContent.trim())
        .filter(Boolean),
      feedText: document.querySelector('#tab-content-feed > div')?.innerText || '',
      rows: document.querySelectorAll('#q-stats-rows > div').length,
      rowLabels: Array.from(document.querySelectorAll('#q-stats-rows > div > span:first-child')).map(s => s.innerText.trim())
    };
  });

  check('Fútbol: partido inicia y muestra sección de partido', matchState.matchVisible);
  check('Fútbol: se puede avanzar a 2T', matchState.activePeriod === '2T', matchState.activePeriod);
  check('Fútbol: acción registrada con período 2T',
    matchState.feedBadges.includes('2T') && /GOL/i.test(matchState.feedText),
    `${matchState.feedBadges.join(' | ')} · ${matchState.feedText.replace(/\n/g, ' / ')}`);
  check('Fútbol: comparativa muestra 2 filas', matchState.rows === 2, String(matchState.rows));
  check('Fútbol: filas rotuladas 1T/2T', matchState.rowLabels.join(',') === '1T,2T', matchState.rowLabels.join(','));

  const relevantErrors = errors.filter(e => !/favicon|manifest|sw\.js|net::ERR|Failed to load resource/i.test(e));
  check('Sin errores JS en consola', relevantErrors.length === 0, relevantErrors.slice(0, 4).join(' || '));

  console.log('\nRESUMEN:', results.filter(r => r.ok).length + '/' + results.length, 'checks OK');
  if (errors.length) console.log('\nErrores capturados:\n' + errors.join('\n'));
} finally {
  await browser.close();
}
