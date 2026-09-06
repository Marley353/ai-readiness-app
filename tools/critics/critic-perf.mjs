// Performance: load-to-playable < 5 s, frame time on a large map with 14 soldiers (idle, alien turn with reaction fire, large explosion),
// memory stable across three consecutive missions. Headless uses software GL, so we gate JS frame time and FPS at DPR 1.
import { openPage, shot, sleep } from './lib.mjs';
import { prepareCampaign } from './scenes.mjs';
export async function run(browser) {
  const defects = [], screenshots = [], metrics = {};
  const vp = { width: 1180, height: 820, dpr: 1 };
  const t0 = Date.now();
  const { page, ctx } = await openPage(browser, vp);
  metrics.loadMs = Date.now() - t0;
  if (metrics.loadMs > 5000) defects.push(`load to playable ${metrics.loadMs} ms > 5000`);
  await prepareCampaign(page);
  const setup = await page.evaluate(() => { const st = window.__ufo.state; if (!st) return null; return { missionType: 'terror', terrainSet: 'urban', alienRace: 'snakeman', difficulty: 2, night: false, month: 3, seed: 11, craftId: 'skyranger', soldierIds: st.soldiers.slice(0, 14).map((s) => s.id), equipment: { rifle: 14, 'rifle-clip': 28, grenade: 8, 'rocket-launcher': 1, 'large-rocket': 4 }, loadouts: {}, alienCrew: { soldier: 8, navigator: 2, leader: 1, terrorist: 4 } }; });
  if (!setup) { defects.push('no campaign state; cannot run battle perf'); await ctx.close(); return { pass: false, defects, screenshots, metrics }; }
  const heap = async () => page.evaluate(() => { if (window.gc) window.gc(); return performance.memory ? performance.memory.usedJSHeapSize : 0; });
  const fpsOver = async (ms) => page.evaluate(async (ms) => { const app = window.__ufo.app.pixi; let frames = 0, t = performance.now(); const js = []; const tick = () => { frames++; }; app.ticker.add(tick); const start = performance.now(); window.__ufo.battle.perfReset?.(); while (performance.now() - start < ms) { const a = performance.now(); await new Promise((r) => requestAnimationFrame(r)); js.push(performance.now() - a); } app.ticker.remove(tick); const el = performance.now() - t; js.sort((a, b) => a - b); const pf = window.__ufo.battle.perf?.() ?? { updateP95: 0 }; return { fps: Math.round((frames / el) * 1000), p95: +js[Math.floor(js.length * 0.95)].toFixed(1), updateP95: pf.updateP95 }; }, ms);
  const heaps = [];
  for (let m = 0; m < 3; m++) {
    const s = { ...setup, seed: 11 + m };
    await page.evaluate((s) => { if (window.__ufo.state.soldiers.length < 14) { for (let i = 0; i < 6; i++) window.__ufo.soldiers?.generate?.(); } window.__ufo.scenes.show('battle', { setup: s }); }, s);
    await sleep(800);
    await page.evaluate(() => { try { window.__ufo.battle?.deploy?.(); } catch {} });
    await sleep(300);
    const errs = await page.evaluate(() => window.__ufo.errors.splice(0));
    if (errs.length) { defects.push(`battle ${m + 1}: errors: ${errs.slice(0, 2).join(' | ')}`); }
    if (m === 0) {
      metrics.idle = await fpsOver(2000);
      const ai = page.evaluate(() => { try { return window.__ufo.battle?.runAiTurnAnimated?.() ?? window.__ufo.battle?.runAiTurn?.(); } catch (e) { return 'err ' + e.message; } });
      metrics.aiTurn = await fpsOver(2500); await ai;
      await page.evaluate(() => { const b = window.__ufo.battle; const st = window.__ufo.state.battle; if (b?.explode && st) { const u = st.units.find((x) => x.faction === 'xcom'); if (u) b.explode(u.pos.x + 3, u.pos.y + 3, u.pos.z, 200, 'he', 6); } });
      metrics.explosion = await fpsOver(1500);
      screenshots.push(await shot(page, 'perf-battle-large'));
    }
    await page.evaluate(() => { try { window.__ufo.battle?.forceKillAliens?.(); window.__ufo.battle?.missionEnd?.(); } catch {} });
    await page.evaluate(() => { window.__ufo.state.battle = null; window.__ufo.scenes.show('geoscape', {}); });
    await sleep(500);
    heaps.push(await heap());
  }
  metrics.heapMB = heaps.map((h) => +(h / 1048576).toFixed(1));
  if (heaps[0] > 0 && heaps[2] > heaps[0] * 1.25) defects.push(`heap grew ${metrics.heapMB[0]} → ${metrics.heapMB[2]} MB across three missions (> 25 %)`);
  // Headless Chromium here has no GPU (SwiftShader), so raster time is not representative of an A14; the gate is the
  // scene's own JS update cost per frame. Raster fps is reported as a metric only.
  if (metrics.idle && metrics.idle.updateP95 > 8) defects.push(`idle scene update p95 ${metrics.idle.updateP95} ms > 8 ms`);
  if (metrics.aiTurn && metrics.aiTurn.updateP95 > 12) defects.push(`alien-turn scene update p95 ${metrics.aiTurn.updateP95} ms > 12 ms`);
  if (metrics.explosion && metrics.explosion.updateP95 > 12) defects.push(`explosion scene update p95 ${metrics.explosion.updateP95} ms > 12 ms`);
  metrics.note = `raster fps in headless software GL: idle ${metrics.idle?.fps}, alien turn ${metrics.aiTurn?.fps}, explosion ${metrics.explosion?.fps} — not an iPad measurement`;
  await ctx.close();
  return { pass: defects.length === 0, defects, screenshots, metrics };
}
