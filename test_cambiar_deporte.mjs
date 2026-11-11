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
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 430, height: 932 }
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  await page.evaluateOnNewDocument(() => {
    // Sembrar solo en la primera carga (no en cada reload)
    if (!sessionStorage.getItem('seed_deporte')) {
      localStorage.setItem('palihue_deporte', 'hockey');
      localStorage.setItem('palihue_deporte_explicita', 'true');
      sessionStorage.setItem('seed_deporte', '1');
    }
  });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#sport-selector.hidden', { timeout: 15000 });

  check('Arranca en hockey con selector oculto',
    await page.$eval('#sport-selector', el => el.classList.contains('hidden')));
  check('window.cambiarDeporte está expuesto',
    await page.evaluate(() => typeof window.cambiarDeporte === 'function'));
  check('Botón Cambiar Deporte es visible',
    await page.$eval('#btn-header-cambiar-deporte', el => el.offsetParent !== null));

  // Click en el botón del header (onclick inline)
  await page.evaluate(() => document.getElementById('btn-header-cambiar-deporte').click());

  // Esperar el reload y que aparezca el selector de deporte
  await page.waitForFunction(
    () => !localStorage.getItem('palihue_deporte_explicita')
      && document.getElementById('sport-selector')
      && !document.getElementById('sport-selector').classList.contains('hidden'),
    { timeout: 20000 }
  );

  check('Preferencia borrada y selector de deporte visible tras el reload', true);
  check('Selector de deporte con las dos opciones',
    await page.evaluate(() => document.querySelectorAll('#sport-selector button').length >= 2));

  // Elegir fútbol desde el selector
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('#sport-selector button'))
      .find(b => /f[uú]tbol/i.test(b.innerText))?.click();
  });
  await page.waitForFunction(
    () => localStorage.getItem('palihue_deporte') === 'futbol'
      && document.getElementById('sport-selector').classList.contains('hidden')
      && Array.from(document.querySelectorAll('#quarter-selector button')).map(b => b.textContent.trim()).join(',') === '1T,2T',
    { timeout: 20000 }
  );

  const state = await page.evaluate(() => ({
    deporte: localStorage.getItem('palihue_deporte'),
    explicita: localStorage.getItem('palihue_deporte_explicita'),
    selectorHidden: document.getElementById('sport-selector').classList.contains('hidden'),
    periods: Array.from(document.querySelectorAll('#quarter-selector button')).map(b => b.textContent.trim())
  }));

  check('Cambio a fútbol aplicado y persistido', state.deporte === 'futbol' && state.explicita === 'true',
    `${state.deporte} / ${state.explicita}`);
  check('Fútbol carga períodos 1T/2T tras el cambio', state.periods.join(',') === '1T,2T', state.periods.join(' | '));

  const relevantErrors = errors.filter(e => !/favicon|manifest|sw\.js|net::ERR|Failed to load resource/i.test(e));
  check('Sin errores JS en consola', relevantErrors.length === 0, relevantErrors.slice(0, 3).join(' || '));

  console.log('\nRESUMEN:', results.filter(r => r.ok).length + '/' + results.length, 'checks OK');
} finally {
  await browser.close();
}
