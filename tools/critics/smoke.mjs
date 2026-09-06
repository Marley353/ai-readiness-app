import { launch, openPage, shot, VIEWPORTS } from './lib.mjs';
const browser = await launch();
const { page, errors } = await openPage(browser, VIEWPORTS['ipad-10']);
const info = await page.evaluate(() => ({ scene: window.__ufo.scene, scenes: window.__ufo.scenes.names(), w: innerWidth, h: innerHeight, dpr: devicePixelRatio, warnings: window.__ufo.warnings.slice(0, 5), errors: window.__ufo.errors }));
console.log(JSON.stringify(info));
console.log('page errors:', errors);
console.log(await shot(page, 'smoke-boot'));
await browser.close();
