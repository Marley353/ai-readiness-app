// Craft: type scale discipline, 8pt grid on panels/buttons/headers, palette discipline on Graphics fills, no overlap of kit panels.
import { openPage, shot, VIEWPORTS } from './lib.mjs';
import { SCENES, visit, walkStage } from './scenes.mjs';
import { readFile } from 'node:fs/promises';
const SCALE = new Set([12, 14, 16, 20, 28]);
export async function paletteSet() {
  const src = await readFile('src/design/palette.ts', 'utf8');
  const set = new Set([...src.matchAll(/0x([0-9a-f]{6})/gi)].map((m) => parseInt(m[1], 16)));
  set.add(0xffffff); set.add(0x000000); return set;
}
export async function run(browser) {
  const defects = [], screenshots = [];
  const pal = await paletteSet();
  const { page, ctx } = await openPage(browser, VIEWPORTS['ipad-10']);
  for (const scene of SCENES) {
    const r = await visit(page, scene);
    if (!r.ok) { defects.push(`${scene.name}: failed to open: ${r.error}`); continue; }
    const objs = await walkStage(page);
    const fonts = new Set();
    for (const o of objs) {
      if (o.fontSize !== undefined) { if (!SCALE.has(o.fontSize)) defects.push(`${scene.name}: text "${o.text}" uses size ${o.fontSize} (scale is 12/14/16/20/28)`); fonts.add(o.fontFamily.split(',')[0]); if (/^[\d.,%$+\-:/ ]+$/.test(o.text ?? 'x') && o.text.trim().length > 0 && !/Mono/.test(o.fontFamily)) defects.push(`${scene.name}: numeric readout "${o.text}" not in the mono face`); }
      if (o.fills) for (const f of o.fills) { if (typeof f.c === 'number' && !pal.has(f.c)) defects.push(`${scene.name}: ${o.type} ${o.label} fill #${f.c.toString(16).padStart(6, '0')} is off-palette`); }
      if (o.tint !== undefined && !pal.has(o.tint) && o.sprite) defects.push(`${scene.name}: sprite ${o.sprite} tint #${o.tint.toString(16)} off-palette`);
      if ((o.kitType === 'panel' || o.kitType === 'button' || o.kitType === 'header') && o.w > 0) { const gx = Math.abs(Math.round(o.x) % 8), gy = Math.abs(Math.round(o.y) % 8); if (gx > 1 && gx < 7 && gy > 1 && gy < 7) defects.push(`${scene.name}: ${o.kitType} "${o.label}" at ${Math.round(o.x)},${Math.round(o.y)} off the 8pt grid`); }
    }
    if (fonts.size > 2) defects.push(`${scene.name}: ${fonts.size} font families in use (${[...fonts].join(', ')})`);
    // Panel overlap (same depth siblings)
    const panels = objs.filter((o) => o.kitType === 'panel' && o.w > 0);
    for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) { const a = panels[i], b = panels[j]; if (a.depth !== b.depth) continue; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 2 && oy > 2) defects.push(`${scene.name}: panels overlap (${Math.round(ox)}×${Math.round(oy)} px)`); }
    screenshots.push(await shot(page, `craft-${scene.name}`));
  }
  await ctx.close();
  const uniq = [...new Set(defects)];
  return { pass: uniq.length === 0, defects: uniq.slice(0, 80), screenshots };
}
