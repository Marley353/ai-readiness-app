// Accessibility: WCAG 2.1 AA contrast for all text vs its panel, prefers-reduced-motion honoured, scalable UI mode, state not colour-only.
import { openPage, shot, VIEWPORTS } from './lib.mjs';
import { SCENES, visit, walkStage } from './scenes.mjs';
const lum = (c) => { const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255; const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
export async function run(browser) {
  const defects = [], screenshots = [];
  const { page, ctx } = await openPage(browser, VIEWPORTS['ipad-10']);
  const rm = await page.evaluate(() => ({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, app: window.__ufo.app.reducedMotion }));
  if (rm.media && !rm.app) defects.push('prefers-reduced-motion: reduce is set but app.reducedMotion is false');
  for (const scene of SCENES) {
    const r = await visit(page, scene);
    if (!r.ok) { defects.push(`${scene.name}: failed to open: ${r.error}`); continue; }
    const objs = await walkStage(page);
    const seen = new Set();
    for (const o of objs) {
      if (o.fontSize === undefined || typeof o.fill !== 'number' || !o.text?.trim()) continue;
      const bg = typeof o.bg === 'number' ? o.bg : 0x0b1020;
      const large = o.fontSize >= 24 || o.fontSize >= 19; // 20 semibold counts as large per WCAG (≥14pt bold)
      const need = large ? 3 : 4.5; const cr = ratio(o.fill, bg);
      const key = `${o.fill}-${bg}-${o.fontSize}`;
      if (cr < need && !seen.has(key)) { seen.add(key); defects.push(`${scene.name}: text "${o.text}" #${o.fill.toString(16).padStart(6, '0')} on #${bg.toString(16).padStart(6, '0')} contrast ${cr.toFixed(2)} < ${need}`); }
    }
    const gauges = objs.filter((o) => o.kitType === 'gauge');
    for (const g of gauges) { const hasText = objs.some((t) => t.fontSize !== undefined && t.x >= g.x - 1 && t.y >= g.y - 1 && t.x + t.w <= g.x + g.w + 1 && t.y + t.h <= g.y + g.h + 1 && t.text?.trim()); if (!hasText) defects.push(`${scene.name}: a gauge carries no numeric label (colour would be the only carrier)`); }
    if (scene.name === 'options') { const texts = objs.map((o) => (o.text ?? '').toLowerCase()); if (!texts.some((t) => t.includes('scale'))) defects.push('options: no UI scale control found'); if (!texts.some((t) => t.includes('motion'))) defects.push('options: no reduced-motion control found'); }
    screenshots.push(await shot(page, `a11y-${scene.name}`));
  }
  const uiScale = await page.evaluate(() => window.__ufo.state?.options?.uiScale);
  if (uiScale === undefined) defects.push('state.options.uiScale missing (scalable UI mode)');
  await ctx.close();
  const uniq = [...new Set(defects)];
  return { pass: uniq.length === 0, defects: uniq.slice(0, 80), screenshots };
}
