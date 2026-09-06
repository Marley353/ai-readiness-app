// Art consistency (decisive): palette-only colours in every generated SVG, no gradients/filters/images, reference sprites present,
// full unit frame coverage, an icon for every item/facility/craft/UFO, no duplicate keys, no missing atlas keys at runtime.
import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { openPage, VIEWPORTS, shot } from './lib.mjs';
import { SCENES, visit } from './scenes.mjs';
const ALLOWED_EXTRA = new Set(['#ffffff', '#b3b3b3', '#808080', '#000000', 'none', 'transparent']);
export async function run(browser) {
  const defects = [], screenshots = [];
  const palSrc = await readFile('src/design/palette.ts', 'utf8');
  const pal = new Set([...palSrc.matchAll(/0x([0-9a-f]{6})/gi)].map((m) => '#' + m[1].toLowerCase()));
  const sprites = [];
  let gens = []; try { gens = (await readdir('assets/gen')).filter((f) => f.endsWith('.mjs')); } catch {}
  for (const g of gens) { try { const m = await import(pathToFileURL(`assets/gen/${g}`).href); sprites.push(...(await m.default()).map((s) => ({ ...s, src: g }))); } catch (e) { defects.push(`generator ${g} failed: ${e.message}`); } }
  const names = new Set();
  for (const s of sprites) {
    if (names.has(s.name)) defects.push(`duplicate sprite key ${s.name}`); names.add(s.name);
    const svg = s.svg;
    if (/<(linearGradient|radialGradient|image|filter|pattern)\b/i.test(svg) && !s.name.startsWith('ref/')) defects.push(`${s.name}: uses gradient/filter/image (flat vector only)`);
    if (/drop-shadow/.test(svg)) defects.push(`${s.name}: CSS drop-shadow filter (must be baked)`);
    if (/\sid="/.test(svg)) defects.push(`${s.name}: carries an id attribute (collision risk)`);
    if (!/viewBox="0 0 \d+ \d+"/.test(svg)) defects.push(`${s.name}: missing viewBox`);
    for (const m of svg.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)"/g)) {
      let c = m[1].toLowerCase(); if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; if (c.length === 9) c = c.slice(0, 7);
      if (!pal.has(c) && !ALLOWED_EXTRA.has(c)) defects.push(`${s.name}: off-palette colour ${m[1]}`);
    }
  }
  for (const ref of ['ref/soldier', 'ref/scientist', 'ref/ufo-wreck', 'ref/alien-core', 'ref/hybrid-craft']) if (!names.has(ref)) defects.push(`reference sprite ${ref} missing from the atlas sources`);
  const bodies = ['xcom-none', 'xcom-personal', 'xcom-power', 'xcom-flying', 'sectoid', 'floater', 'snakeman', 'muton', 'ethereal', 'chryssalid', 'silacoid', 'celatid', 'reaper', 'cyberdisc', 'sectopod', 'zombie', 'civilian-m', 'civilian-f', 'tank-cannon', 'tank-rocket', 'tank-laser', 'hovertank-plasma', 'hovertank-launcher'];
  for (const b of bodies) for (let f = 0; f < 5; f++) for (const a of ['idle', 'walk0', 'walk1', 'fire', 'hit', 'fall0', 'fall1', 'dead']) if (!names.has(`unit/${b}/${f}/${a}`)) defects.push(`missing unit frame unit/${b}/${f}/${a}`);
  // Every data id has an icon
  const ids = async (file, re) => { try { const s = await readFile(file, 'utf8'); return [...s.matchAll(re)].map((m) => m[1]); } catch { return []; } };
  for (const id of await ids('src/data/items.ts', /sprite:\s*'item\/([a-z0-9-]+)'/g)) if (!names.has(`item/${id}`)) defects.push(`missing item icon item/${id}`);
  for (const id of await ids('src/data/facilities.ts', /sprite:\s*'facility\/([a-z0-9-]+)'/g)) if (!names.has(`facility/${id}`)) defects.push(`missing facility icon facility/${id}`);
  for (const id of await ids('src/data/craft.ts', /sprite:\s*'craft\/([a-z0-9-]+)'/g)) if (!names.has(`craft/${id}`)) defects.push(`missing craft sprite craft/${id}`);
  for (const id of await ids('src/data/ufos.ts', /sprite:\s*'ufo\/([a-z0-9-]+)'/g)) if (!names.has(`ufo/${id}`)) defects.push(`missing UFO sprite ufo/${id}`);
  for (const id of await ids('src/data/terrain.ts', /shape:\s*'(shape\/[a-z0-9-]+)'/g)) if (!names.has(id)) defects.push(`terrain references missing shape ${id}`);
  // Runtime: missing atlas keys and placeholder text
  const { page, ctx } = await openPage(browser, VIEWPORTS['ipad-10']);
  const missing = new Set();
  for (const scene of SCENES) { const r = await visit(page, scene); if (!r.ok) continue; for (const w of r.warnings) { const m = w.match(/atlas: missing sprite (.+)/); if (m) missing.add(m[1]); } }
  for (const k of missing) defects.push(`runtime requested missing atlas key ${k}`);
  screenshots.push(await shot(page, 'art-sample'));
  await ctx.close();
  // Placeholder copy
  const grep = async (dir) => { let out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = `${dir}/${e.name}`; if (e.isDirectory()) out = out.concat(await grep(p)); else if (/\.(ts|mjs|html)$/.test(p)) { const s = await readFile(p, 'utf8'); s.split('\n').forEach((l, i) => { if (/TODO|FIXME|lorem ipsum|placeholder/i.test(l) && !/critic|touch-ok|no placeholder|placeholders/i.test(l)) out.push(`${p}:${i + 1}: ${l.trim().slice(0, 80)}`); }); } } return out; };
  for (const hit of await grep('src')) defects.push(`placeholder/TODO text: ${hit}`);
  const uniq = [...new Set(defects)];
  return { pass: uniq.length === 0, defects: uniq.slice(0, 120), screenshots };
}
