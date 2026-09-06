// Touch parity: every interactive element ≥ 44 CSS px, no hover dependencies, no accidental zoom/scroll/selection, state survives backgrounding.
import { openPage, shot, VIEWPORTS, sleep } from './lib.mjs';
import { SCENES, visit, walkStage } from './scenes.mjs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
async function sources(dir) { let out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) out = out.concat(await sources(p)); else if (p.endsWith('.ts')) out.push(p); } return out; }
export async function run(browser) {
  const defects = [], screenshots = [];
  // Static: hover / mouse-only handlers
  for (const f of await sources('src')) { const s = await readFile(f, 'utf8'); for (const bad of ['pointerover', 'pointerout', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', ':hover', 'rightclick', 'contextmenu']) { if (s.includes(bad) && !f.includes('app/App.ts') && !f.includes('critics')) { const line = s.split('\n').findIndex((l) => l.includes(bad)) + 1; if (!s.split('\n')[line - 1].includes('// touch-ok')) defects.push(`${f}:${line} uses ${bad} (hover/mouse-only dependency)`); } } }
  const idx = await readFile('index.html', 'utf8');
  for (const need of ['user-scalable=no', 'viewport-fit=cover', 'touch-action: none', 'user-select: none', '-webkit-touch-callout: none', 'overscroll-behavior: none', 'apple-mobile-web-app-capable']) if (!idx.includes(need)) defects.push(`index.html missing ${need}`);
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const { page, ctx } = await openPage(browser, vp);
    for (const scene of SCENES) {
      const r = await visit(page, scene);
      if (!r.ok) { defects.push(`[${vpName}] ${scene.name}: failed to open: ${r.error}`); continue; }
      if (r.errors.length) defects.push(`[${vpName}] ${scene.name}: console errors: ${r.errors.slice(0, 2).join(' | ')}`);
      const objs = await walkStage(page);
      const interactive = objs.filter((o) => (o.eventMode === 'static' || o.eventMode === 'dynamic') && (o.kitType === 'button' || o.kitType === 'row' || o.label.startsWith('tap:') || o.kitType === 'stepper'));
      for (const o of interactive) {
        const w = o.hit?.w ?? o.w, h = o.hit?.h ?? o.h;
        if (w + 0.5 < 44 || h + 0.5 < 44) defects.push(`[${vpName}] ${scene.name}: ${o.kitType || o.type} "${o.label || o.text || ''}" hit area ${Math.round(w)}×${Math.round(h)} < 44`);
        if (o.x < -1 || o.y < -1 || o.x + w > vp.width + 1 || o.y + h > vp.height + 1) defects.push(`[${vpName}] ${scene.name}: ${o.kitType} "${o.label || ''}" off-screen at ${Math.round(o.x)},${Math.round(o.y)}`);
      }
      if (vpName === 'ipad-10' || vpName === 'ipad-mini') screenshots.push(await shot(page, `touch-${vpName}-${scene.name}`));
    }
    // Backgrounding: pause + autosave
    if (vpName === 'ipad-10') {
      await visit(page, SCENES.find((s) => s.name === 'geoscape'));
      await page.evaluate(() => { window.__ufo.state && (window.__ufo.state.paused = false); document.dispatchEvent(new Event('visibilitychange')); });
      await sleep(600);
      const bg = await page.evaluate(async () => { const u = window.__ufo; const paused = u.state?.paused; const saves = await (await import('./src/core/save.ts').catch(() => null))?.listSaves?.().catch(() => null); return { paused, hasState: !!u.state }; });
      if (bg.hasState && bg.paused !== true) defects.push('backgrounding did not pause the campaign');
      const saved = await page.evaluate(() => new Promise((res) => { const req = indexedDB.open('ufo-homage'); req.onsuccess = () => { try { const t = req.result.transaction('saves', 'readonly').objectStore('saves').get('auto-interrupt'); t.onsuccess = () => res(!!t.result); t.onerror = () => res(false); } catch { res(false); } }; req.onerror = () => res(false); }));
      if (!saved) defects.push('backgrounding did not write the interrupt autosave to IndexedDB');
      // Two-finger and pinch must not zoom the page
      const scale = await page.evaluate(() => visualViewport?.scale ?? 1);
      if (scale !== 1) defects.push(`page zoomed (visualViewport.scale=${scale})`);
    }
    await ctx.close();
  }
  return { pass: defects.length === 0, defects: [...new Set(defects)].slice(0, 80), screenshots };
}
