// Shared scene visiting for the sweep critics. Each scene: how to prepare state and open it.
import { sleep } from './lib.mjs';
export async function prepareCampaign(page) {
  return page.evaluate(async () => {
    const u = window.__ufo; const log = [];
    try { if (u.newCampaign) { u.newCampaign(1, 42); log.push('campaign'); } else log.push('hook newCampaign missing'); } catch (e) { log.push('newCampaign threw: ' + e.message); }
    try { if (u.placeFirstBase && u.state && u.state.bases.length === 0) { u.placeFirstBase(-1, 52, 'Alpha Base'); log.push('base'); } } catch (e) { log.push('placeFirstBase threw: ' + e.message); }
    return log;
  });
}
export async function battleSetup(page) {
  return page.evaluate(() => {
    const u = window.__ufo;
    if (u.menu?.tutorialSetup) { try { return u.menu.tutorialSetup(); } catch (e) { return null; } }
    const st = u.state; if (!st) return null;
    return { missionType: 'crash', terrainSet: 'farm', ufoType: 'small-scout', alienRace: 'sectoid', difficulty: 1, night: false, month: 0, seed: 7, craftId: 'skyranger', soldierIds: st.soldiers.slice(0, 8).map((s) => s.id), equipment: { rifle: 8, 'rifle-clip': 16, grenade: 4 }, loadouts: {} };
  });
}
export const SCENES = [
  { name: 'menu', open: async (p) => p.evaluate(() => window.__ufo.scenes.show('menu', {})) },
  { name: 'newgame', open: async (p) => p.evaluate(() => window.__ufo.scenes.show('newgame', {})) },
  { name: 'options', open: async (p) => p.evaluate(() => window.__ufo.scenes.show('options', {})) },
  { name: 'saveload', open: async (p) => p.evaluate(() => window.__ufo.scenes.show('saveload', { mode: 'save' })) },
  { name: 'geoscape', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('geoscape', {})); } },
  { name: 'base', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('base', { baseId: window.__ufo.state?.bases[0]?.id })); } },
  { name: 'soldiers', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('soldiers', { baseId: window.__ufo.state?.bases[0]?.id })); } },
  { name: 'inventory', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('inventory', { baseId: window.__ufo.state?.bases[0]?.id, soldierId: window.__ufo.state?.soldiers[0]?.id })); } },
  { name: 'research', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('research', { baseId: window.__ufo.state?.bases[0]?.id })); } },
  { name: 'manufacture', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('manufacture', { baseId: window.__ufo.state?.bases[0]?.id })); } },
  { name: 'ufopaedia', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => window.__ufo.scenes.show('ufopaedia', {})); } },
  { name: 'battle', open: async (p) => { await prepareCampaign(p); const setup = await battleSetup(p); await p.evaluate((setup) => window.__ufo.scenes.show('battle', { setup }), setup); await sleep(500); await p.evaluate(() => { const u = window.__ufo; try { u.battle?.deploy?.(); } catch {} }); } },
  { name: 'intercept', open: async (p) => { await prepareCampaign(p); await p.evaluate(() => { const u = window.__ufo; const b = u.state?.bases[0]; let ufoId = null; try { ufoId = u.spawnUfo?.('small-scout', 'sectoid', (b?.lon ?? 0) + 3, (b?.lat ?? 50) + 1); } catch {} const craft = u.state?.craft.find((c) => c.type === 'interceptor'); u.scenes.show('intercept', { craftId: craft?.id, ufoId: typeof ufoId === 'object' ? ufoId?.id : ufoId }); }); } },
];
export async function visit(page, scene) {
  const t0 = Date.now();
  try { await scene.open(page); } catch (e) { return { ok: false, error: e.message }; }
  await sleep(400);
  const info = await page.evaluate(() => ({ scene: window.__ufo.scene, errors: window.__ufo.errors.splice(0), warnings: window.__ufo.warnings.splice(0) }));
  return { ok: true, ms: Date.now() - t0, ...info };
}
/** Walk the Pixi stage; return flat records for visible display objects. */
export async function walkStage(page) {
  return page.evaluate(() => {
    const out = []; const stage = window.__ufo.app.pixi.stage;
    const visit = (o, depth, parentBg) => {
      if (!o.visible || o.alpha === 0) return;
      let bg = parentBg;
      if (o.bgColor !== undefined) bg = o.bgColor;
      const rec = { type: o.constructor.name, label: o.label ?? '', kitType: o.kitType ?? '', eventMode: o.eventMode ?? '', depth, bg };
      try { const b = o.getBounds(); rec.x = b.x; rec.y = b.y; rec.w = b.width; rec.h = b.height; } catch { rec.x = rec.y = rec.w = rec.h = 0; }
      if (o.hitArea) { try { const g = o.toGlobal({ x: o.hitArea.x, y: o.hitArea.y }); const g2 = o.toGlobal({ x: o.hitArea.x + o.hitArea.width, y: o.hitArea.y + o.hitArea.height }); rec.hit = { x: g.x, y: g.y, w: g2.x - g.x, h: g2.y - g.y }; } catch {} }
      if (o.style && o.text !== undefined) { rec.text = String(o.text).slice(0, 60); rec.fontSize = o.style.fontSize; rec.fontFamily = String(o.style.fontFamily); const f = o.style.fill; rec.fill = typeof f === 'number' ? f : (f && typeof f === 'object' && 'color' in f) ? f.color : f; }
      if (o.context && o.context.instructions) { rec.fills = o.context.instructions.filter((i) => i.action === 'fill' || i.action === 'stroke').map((i) => ({ a: i.action, c: i.data?.style?.color, alpha: i.data?.style?.alpha })); }
      if (o.texture && o.texture.label) rec.sprite = o.texture.label;
      if (o.tint !== undefined && o.tint !== 0xffffff) rec.tint = o.tint;
      out.push(rec);
      if (o.children) for (const c of o.children) visit(c, depth + 1, bg);
    };
    visit(stage, 0, 0x0b1020);
    return out;
  });
}
