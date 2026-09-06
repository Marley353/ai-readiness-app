// Boot check for the single-file build: UFO_URL=http://127.0.0.1:4175/artifact-test.html node tools/critics/check-single.mjs
import { launch, openPage, shot, VIEWPORTS } from './lib.mjs';
const browser = await launch();
const { page, errors } = await openPage(browser, VIEWPORTS['ipad-10']);
const bad = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__ufo && window.__ufo.scene === 'menu', null, { timeout: 30000 });
const info = await page.evaluate(() => ({
  scene: window.__ufo.scene, warnings: window.__ufo.warnings.slice(0, 5), errors: window.__ufo.errors,
  sans: document.fonts.check('600 16px "IBM Plex Sans"'), mono: document.fonts.check('400 16px "IBM Plex Mono"'),
  requests: performance.getEntriesByType('resource').length,
}));
await page.evaluate(() => window.__ufo.newCampaign(1, 4242));
await page.evaluate(() => window.__ufo.placeFirstBase(-1, 52, 'Alpha Base'));
await page.waitForTimeout(800);
const after = await page.evaluate(() => ({ scene: window.__ufo.scene, warnings: window.__ufo.warnings.slice(0, 5), errors: window.__ufo.errors }));
console.log(JSON.stringify({ info, after, bad, pageErrors: errors }));
console.log(await shot(page, 'single-geoscape'));
await browser.close();
