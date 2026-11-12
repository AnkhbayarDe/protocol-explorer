import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import puppeteer from 'puppeteer';
import { build } from './build_mn_module.mjs';
import { bundlePath, root } from './mn-catalog.mjs';

await build({ check: true });
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const body = fs.readFileSync(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}/`;
const systemChrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(file => file && fs.existsSync(file));
let browser;
const errors = [];
try {
  browser = await puppeteer.launch({ headless: true, ...(systemChrome ? { executablePath: systemChrome } : {}) });
  const page = await browser.newPage();
  let phase = 'initialization';
  await page.setViewport({ width: 1440, height: 1000 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${phase}: ${message.text()}`); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  // Expose existing module bindings only in this test's response; no test API is
  // shipped in the application. This lets us verify wire bytes across languages.
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().endsWith('/assets/index-4NePqLyW.js')) {
      const source = fs.readFileSync(bundlePath, 'utf8') + '\nglobalThis.__mnTest={lessons:cs,frames:Cr,translate:b,setLanguage:wr,pause:()=>le.pause()};';
      void request.respond({ status: 200, contentType: 'application/javascript', body: source });
    } else void request.continue();
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.lang === 'mn' && document.querySelector('.lang-code')?.textContent === 'MN');
  assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr', 'New visitors default to Mongolian');
  await page.evaluate(() => localStorage.setItem('protocol-explorer:lang', 'en'));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!globalThis.__mnTest && document.querySelector('.overview h3')?.textContent === 'HTTP');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en', 'Saved language overrides the default');
  const wireBefore = await page.evaluate(() => Object.values(__mnTest.lessons).map(l => __mnTest.frames(l).map(f => f.bytes)));
  await page.click('.lang .menu-btn');
  await page.click('[data-lang="mn"]');
  await page.waitForFunction(() => document.documentElement.lang === 'mn' && document.querySelector('.lang-code').textContent === 'MN');
  assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
  assert.equal(await page.evaluate(() => localStorage.getItem('protocol-explorer:lang')), 'mn');
  const wireAfter = await page.evaluate(() => Object.values(__mnTest.lessons).map(l => __mnTest.frames(l).map(f => f.bytes)));
  assert.deepEqual(wireAfter, wireBefore, 'Language switching must preserve every wire byte');
  const untranslatedNotes = await page.evaluate(() => {
    const missing = new Set();
    for (const lesson of Object.values(__mnTest.lessons)) for (const frame of __mnTest.frames(lesson)) {
      for (const field of frame.fields) if (field.note && /[a-z]{3}/i.test(field.note) && __mnTest.translate(field.note) === field.note) missing.add(field.note);
    }
    return [...missing];
  });
  assert.deepEqual(untranslatedNotes, [], 'Every decoded explanatory note must be translated');
  let steps = 0, inspectors = 0;
  const ids = await page.evaluate(() => Object.keys(__mnTest.lessons));
  for (const id of ids) {
    phase = `lesson ${id}`;
    await page.evaluate(id => document.querySelector(`.proto[data-lesson="${id}"] .proto-row`).click(), id);
    await page.waitForFunction(id => document.querySelector('.topbar').dataset.lesson === id, {}, id);
    const overview = await page.evaluate(id => ({ actual: document.querySelector('.overview-desc').textContent, expected: __mnTest.translate(__mnTest.lessons[id].overview.description) }), id);
    assert.equal(overview.actual, overview.expected, `${id} overview`);
    const count = await page.evaluate(id => __mnTest.lessons[id].steps.length, id);
    for (let step = 0; step < count; step++) {
      await page.evaluate(({ id, step }) => {
        document.querySelector(`.proto[data-lesson="${id}"] [data-step="${step}"] .step-btn`).click();
        __mnTest.pause();
      }, { id, step });
      await page.waitForFunction(({ id, step }) => document.querySelector('.explain-text').textContent === __mnTest.translate(__mnTest.lessons[id].steps[step].detail), {}, { id, step });
      const text = await page.$eval('.explain-label', element => element.textContent);
      assert.ok(!/\{(?:n|total)\}/.test(text), 'Step counters must interpolate');
      assert.match(text, /АЛХАМ/);
      steps++;
    }
    // Return to overview so every packet is available, including future rows.
    await page.evaluate(() => document.querySelector('[data-action="reset"]').click());
    const samples = await page.evaluate(id => {
      const frames = __mnTest.frames(__mnTest.lessons[id]);
      const custom = frames.findIndex(f => f.layers.some(l => ['http2', 'quic', 'ws', 'mqtt', 'sse', 'chunked', 'grpc'].includes(l.id)));
      return [...new Set([0, frames.length - 1, ...(custom >= 0 ? [custom] : [])])];
    }, id);
    for (const index of samples) {
      await page.evaluate(index => document.querySelector(`.packet-rows tr[data-packet="${index}"]`).click(), index);
      await page.waitForFunction(index => { const e = document.querySelector('.inspector'); return !e.hidden && Number(e.dataset.index) === index; }, {}, index);
      assert.match(await page.$eval('.ins-hex .hx-head', element => element.textContent), /БАЙТ/);
      assert.ok(await page.$('.ins-field'), `${id}: inspector must contain decoded fields`);
      await page.click('[data-ins="close"]');
      inspectors++;
    }
  }
  await page.reload({ waitUntil: 'networkidle0' });
  phase = 'language switching';
  await page.waitForFunction(() => document.querySelector('.lang-code')?.textContent === 'MN');
  // Exercise real language menu updates, including RTL -> LTR restoration.
  for (const lang of ['en', 'fa', 'mn']) {
    await page.click('.lang .menu-btn');
    await page.click(`[data-lang="${lang}"]`);
    await page.waitForFunction(lang => document.documentElement.lang === lang, {}, lang);
    assert.equal(await page.evaluate(() => document.documentElement.dir), lang === 'fa' ? 'rtl' : 'ltr');
  }
  phase = 'temporarily hidden diagram';
  const oldView = await page.$eval('.network', e => e.getAttribute('viewBox'));
  await page.$eval('.network', e => { e.style.display = 'none'; });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.$eval('.network', e => e.getAttribute('viewBox')), oldView, 'Zero-size diagrams must retain the last valid camera');
  await page.$eval('.network', e => { e.style.removeProperty('display'); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.ok(await page.$eval('.network', e => e.getAttribute('viewBox').split(' ').map(Number).every(Number.isFinite)));
  await page.screenshot({ path: path.join(os.tmpdir(), 'protocol-mn-desktop.png'), fullPage: true });
  for (const width of [390, 768]) {
    phase = `viewport ${width}`;
    await page.setViewport({ width, height: 844 });
    await page.waitForFunction(() => document.documentElement.classList.contains('is-stacked'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${width}px page must not overflow`);
    await page.click('.drawer-btn');
    await page.waitForFunction(() => document.querySelector('.shell').classList.contains('is-drawer-open'));
    await page.click('.proto[data-lesson="http2"] .proto-row');
    await page.waitForFunction(() => !document.querySelector('.shell').classList.contains('is-drawer-open'));
    assert.match(await page.$eval('.overview-desc', e => e.textContent), /[\u0400-\u04ff]/u);
    await page.screenshot({ path: path.join(os.tmpdir(), `protocol-mn-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, [], 'Browser must have no JS / console / HTTP errors');
  console.log(`Passed: ${ids.length} lessons, ${steps} steps, ${inspectors} inspectors, 270 unchanged wire frames, reload, EN/FA/MN switching, 390px and 768px layouts.`);
  console.log(`Screenshots: ${os.tmpdir()}/protocol-mn-{desktop,390,768}.png`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
