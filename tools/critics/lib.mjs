// Shared critic helpers: launch Chromium, open the app at iPad viewports with touch emulation, screenshot.
import { chromium, devices } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
export const EXEC = '/opt/pw-browsers/chromium';
export const BASE_URL = process.env.UFO_URL ?? 'http://127.0.0.1:4173/';
export const VIEWPORTS = {
  'ipad-mini': { width: 1133, height: 744, dpr: 2 },
  'ipad-10': { width: 1180, height: 820, dpr: 2 },
  'ipad-pro-11': { width: 1194, height: 834, dpr: 2 },
  'ipad-pro-13': { width: 1376, height: 1024, dpr: 2 },
  'ipad-97': { width: 1024, height: 768, dpr: 2 },
};
export async function launch() { return chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] }); }
export async function openPage(browser, vp = VIEWPORTS['ipad-10'], query = '?test=1') {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true, userAgent: devices['iPad Pro 11'].userAgent, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE_URL + query, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__ufo && !document.getElementById('boot'), null, { timeout: 30000 });
  return { ctx, page, errors };
}
export async function shot(page, name) { await mkdir('screenshots', { recursive: true }); const p = `screenshots/${name}.png`; await page.screenshot({ path: p }); return p; }
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
