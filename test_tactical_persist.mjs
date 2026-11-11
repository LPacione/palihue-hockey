import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5174/';

const MOCK_SUPABASE_JS = `
window.__sbCalls = { inserts: {}, upserts: {}, deletes: [] };
window.supabase = {
  createClient() {
    return {
      from(table) {
        const q = {
          select() { return q; },
          or() { return q; },
          order() { return q; },
          limit() { return q; },
          delete() {
            const chain = {
              eq(col, val) {
                window.__sbCalls.deletes.push({ table, col, val });
                return chain;
              },
              then(resolve) { return Promise.resolve({ error: null }).then(resolve); }
            };
            return chain;
          },
          insert(rows) {
            window.__sbCalls.inserts[table] = rows;
            return Promise.resolve({ error: null });
          },
          upsert(rows) {
            window.__sbCalls.upserts[table] = rows;
            return Promise.resolve({ error: null });
          },
          then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); }
        };
        return q;
      }
    };
  }
};
`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ` :: ${detail}` : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 430, height: 932 }
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().includes('@supabase/supabase-js')) {
      req.respond({ status: 200, contentType: 'application/javascript', body: MOCK_SUPABASE_JS });
    } else {
      req.continue();
    }
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('palihue_deporte', 'hockey');
    localStorage.setItem('palihue_deporte_explicita', 'true');
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.select('#setup-categoria', '6ta_fem');
  await page.waitForFunction(() => {
    const c = document.querySelector('#tactical-board-container canvas');
    return c && c.width > 100;
  }, { timeout: 30000 });
  await new Promise(r => setTimeout(r, 700));

  check('Mock de Supabase activo', await page.evaluate(() => !!window.__sbCalls));
  check('Fichas cargadas con datos mock', await page.evaluate(() => document.getElementById('position-legend').children.length === 11));
  check('Botón iniciar habilitado con 11/11', await page.evaluate(() => document.getElementById('btn-iniciar-partido').disabled === false));

  // Arrastrar la punta para que las coordenadas no sean las de fábrica
  const dragPoint = await page.evaluate(() => {
    const c = document.querySelector('#tactical-board-container canvas');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.82 };
  });
  await page.mouse.move(dragPoint.x, dragPoint.y);
  await page.mouse.down();
  await page.mouse.move(dragPoint.x + 35, dragPoint.y - 55, { steps: 10 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 300));

  await page.select('#setup-fecha', 'Fecha 3');
  await page.click('#btn-iniciar-partido');
  await new Promise(r => setTimeout(r, 900));

  const state = await page.evaluate(() => ({
    calls: window.__sbCalls,
    matchActive: document.getElementById('section-match').classList.contains('active'),
    fieldButtons: document.querySelectorAll('#players-in-field-grid button').length,
    fieldNames: Array.from(document.querySelectorAll('#players-in-field-grid button')).map(b => b.innerText.trim())
  }));

  const rows = state.calls.inserts['formaciones_partido'] || [];
  const names = rows.map(r => r.jugadora_nombre);
  const uniqueNames = new Set(names);

  check('Se guardaron 11 posiciones en formaciones_partido', rows.length === 11, `${rows.length} filas`);
  check('Las 11 jugadoras son únicas', uniqueNames.size === 11, `${uniqueNames.size} únicas`);
  check('Filas incluyen fecha, categoría y deporte',
    rows.every(r => r.partido_fecha === 'Fecha 3' && r.categoria === '6ta_fem' && r.deporte === 'hockey'));
  check('Filas incluyen esquema táctico', rows.every(r => r.esquema_tactico === '3-3-3-1'), rows[0]?.esquema_tactico);
  check('Filas incluyen coordenadas X/Y numéricas',
    rows.every(r => typeof r.posicion_x_pct === 'number' && typeof r.posicion_y_pct === 'number'),
    `punta: (${rows.find(r => r.posicion_id === 'PUNTA')?.posicion_x_pct}, ${rows.find(r => r.posicion_id === 'PUNTA')?.posicion_y_pct})`);
  check('Se limpió la formación previa del partido', state.calls.deletes.filter(d => d.table === 'formaciones_partido').length === 3);
  check('El partido pasó a la pestaña En Vivo', state.matchActive);
  check('El 11 inicial está activo en la cancha del partido', state.fieldButtons === 12, `${state.fieldButtons - 1} jugadoras + "No id"`);
  check('Sin errores JS', errors.length === 0, errors.join(' | '));

  console.log(`\nRESUMEN: ${results.filter(r => r.ok).length}/${results.length} checks OK`);
} finally {
  await browser.close();
}
