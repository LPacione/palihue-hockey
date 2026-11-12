// Captura de pantallas para la ronda de inspección (desktop/tablet + retrato).
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.APP_URL || 'http://localhost:5178/';
const SPORT = process.env.SPORT || 'hockey';
const SUFFIX = process.env.SUFFIX || '';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'landscape', width: 1280, height: 800 },
  { name: 'portrait', width: 834, height: 1194 }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars']
  });

  const problems = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

    page.on('console', m => {
      if (m.type() === 'error') problems.push(`[${vp.name}] console: ${m.text()}`);
    });
    page.on('pageerror', e => problems.push(`[${vp.name}] pageerror: ${e.message}`));
    page.on('dialog', async d => { await d.accept(); });

    await page.evaluateOnNewDocument((sport) => {
      localStorage.setItem('palihue_deporte', sport);
      localStorage.setItem('palihue_deporte_explicita', 'true');
    }, SPORT);

    await page.goto(URL, { waitUntil: 'networkidle2' });
    await sleep(1800);

    const shot = n => page.screenshot({ path: path.join(OUT, `${vp.name}-${n}${SUFFIX}.png`) });

    await shot('1-config');

    // Cargar categoría (mock) -> habilita pizarra táctica
    await page.select('#setup-categoria', '7ma_fem');
    await sleep(1500);
    await shot('2-config-cargada');

    // Táctica
    await page.click('.main-tab[data-tab="tactica"]');
    await sleep(1400);
    await shot('3-tactica');

    // Banco de suplentes: abrir modal, agregar una jugadora
    await page.evaluate(() => window.abrirModalSuplentes());
    await sleep(500);
    await shot('3b-banco-modal');
    await page.evaluate(() => {
      const b = document.querySelector('#bench-player-list button');
      if (b) b.click();
    });
    await sleep(600);
    await shot('3c-banco-con-suplente');

    const lineup = await page.evaluate(() => ({
      bench: document.getElementById('bench-count').textContent.trim(),
      benchNames: document.getElementById('bench-grid').innerText.replace(/\s+/g, ' ').trim(),
      assigned: window.getTacticalState().asignadas,
      validation: document.getElementById('validation-count').textContent.trim()
    }));
    console.log(`[${vp.name}] lineup:`, JSON.stringify(lineup));

    // Partido: estado vacío
    await page.click('.main-tab[data-tab="partido"]');
    await sleep(700);
    await shot('4-partido-vacio');

    // Preparar e iniciar partido
    await page.click('.main-tab[data-tab="config"]');
    await sleep(400);
    await page.evaluate(() => {
      document.getElementById('setup-fecha').value = 'Fecha 1';
      window.iniciarPartido();
    });
    await sleep(1200);
    await shot('5-partido');

    const enCancha = await page.evaluate(() => ({
      inField: document.querySelectorAll('#players-in-field-grid .player-chip').length,
      nombres: document.getElementById('players-in-field-grid').innerText.replace(/\s+/g, ' ').trim()
    }));
    console.log(`[${vp.name}] en cancha:`, JSON.stringify(enCancha));

    // Registrar una acción (acción + jugadora)
    await page.evaluate(() => {
      const a = document.querySelectorAll('#action-buttons-grid .action-btn');
      if (a[0]) a[0].click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const p = document.querySelectorAll('#players-in-field-grid .player-chip');
      if (p[0]) p[0].click();
    });
    await sleep(400);
    await shot('6-registro');

    // Registrar en el feed
    await page.evaluate(() => window.guardarAccionActual());
    await sleep(700);
    await shot('7-feed');

    // Acción que exige zona -> evidencia del selector de zona (48px)
    await page.evaluate(() => {
      const chip = Array.from(document.querySelectorAll('#action-categories .chip'))
        .find(c => /P[eé]rdidas/i.test(c.textContent));
      if (chip) chip.click();
    });
    await sleep(600);
    await shot('7b-zona');

    // Estadísticas
    await page.click('.main-tab[data-tab="stats"]');
    await sleep(800);
    await shot('8-stats');

    // Métricas de layout: ¿hay scroll vertical en la vista principal?
    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const live = document.getElementById('tab-partido');
      const content = document.getElementById('partido-content');
      return {
        docScroll: de.scrollHeight - de.clientHeight,
        docScrollW: de.scrollWidth - de.clientWidth,
        liveScroll: live ? live.scrollHeight - live.clientHeight : null,
        contentScroll: content ? content.scrollHeight - content.clientHeight : null,
        vh: window.innerHeight,
        vw: window.innerWidth
      };
    });
    console.log(`[${vp.name}] layout:`, JSON.stringify(metrics));

    await page.close();
  }

  await browser.close();
  console.log('--- PROBLEMAS ---');
  console.log(problems.length ? problems.join('\n') : 'sin errores de consola');
  console.log('DONE');
})();
