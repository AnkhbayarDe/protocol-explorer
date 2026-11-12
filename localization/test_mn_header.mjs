import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { once } from 'node:events';
import puppeteer from 'puppeteer';
import { root } from './mn-catalog.mjs';

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    const body = fs.readFileSync(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
let browser;
try {
  browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('protocol-explorer:lang', 'mn');
    localStorage.setItem('protocol-explorer:theme', 'light');
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle0' });
  const failures = [];
  for (const width of [360, 390, 640, 768, 900, 1100, 1280, 1366, 1440, 1920]) {
    await page.setViewport({ width, height: 900 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const state = await page.evaluate(() => {
      const rect = selector => {
        const e = document.querySelector(selector), r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height, font: getComputedStyle(e).fontSize };
      };
      const theme = rect('.theme-toggle'), lang = rect('.lang');
      const buttons = [...document.querySelectorAll('.theme-toggle button')].filter(e => e.getBoundingClientRect().width > 0);
      return { layout: document.documentElement.dataset.layout, theme, lang, viewport: innerWidth, buttons: buttons.length,
        visible: buttons.every(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width >= 24 && r.height >= 24; }) };
    });
    if (!state.visible || state.buttons === 0 || state.theme.right > width || Math.abs(state.theme.y - state.lang.y) > 8) failures.push({ width, ...state });
    if ([390, 1366, 1440].includes(width)) await page.screenshot({ path: path.join(os.tmpdir(), `protocol-mn-header-${width}.png`) });
  }
  assert.deepEqual(failures, [], 'Theme toggle must fit next to the language selector and remain visible');
  await page.click('.theme-toggle button:not(.is-active)');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.click('.theme-toggle button:not(.is-active)');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  console.log('Passed: Mongolian theme controls visible at 10 viewport widths and theme switching works.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
