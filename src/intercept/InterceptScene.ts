import { Container, Graphics } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, Gauge, header, HEADER_H } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { startEngagement, setStance, step, snapshot, setResolveHandler, engagementForCraft, removeEngagement, STANCES, DOGFIGHT, type Engagement, type Stance } from './sim';
import { resolveInterception, advanceTime } from '../geoscape/sim';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { UFOS } from '../data/ufos';
import { sfx } from '../audio/sfx';
export class InterceptScene implements Scene {
  private root!: Container; private e: Engagement | null = null; private acc = 0; private radar = new Graphics(); private craftG!: Gauge; private ufoG!: Gauge; private dist!: any; private logT!: any; private weaponsT!: any; private stanceBtns: any[] = []; private done = false; private endTimer = 0;
  mount(root: Container, params: any) {
    this.root = root; const s = getState(); const craft = s.craft.find((c) => c.id === params?.craftId); const ufo = s.ufos.find((u) => u.id === params?.ufoId);
    if (!craft || !ufo) { scenes.show('geoscape'); return; }
    setResolveHandler((st, r) => resolveInterception(st, { craftId: r.craftId, ufoId: r.ufoId, outcome: r.outcome, ufoDamage: r.ufoDamage, craftDamage: r.craftDamage }));
    this.e = engagementForCraft(craft.id) ?? startEngagement(s, craft.id, ufo.id, { craft: CRAFT[craft.type], weapons: craft.weapons.map((w) => (w ? CRAFT_WEAPONS[w.def] : null)), ufo: UFOS[ufo.type] });
    if (!this.e) { scenes.show('geoscape'); return; }
    this.build(); sfx.music('ambient-ufo');
  }
  unmount() {} resize() { if (this.e) { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); } }
  private build() {
    const e = this.e!; const s = getState(); const w = app.w; const craft = s.craft.find((c) => c.id === e.craftId)!; const ufo = s.ufos.find((u) => u.id === e.ufoId)!;
    this.root.addChild(header(w, `${craft.name} — ${ufo.hyperDetected ? UFOS[ufo.type].name : 'Unknown craft'}`, { subtitle: UFOS[ufo.type].size }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const pw = Math.min(360, w - x0 - app.safe.right - S.x2 - 320); const ph = app.h - y0 - app.safe.bottom - S.x2;
    const p = new Panel(pw, ph, { title: 'Engagement' }); p.position.set(x0, y0); this.root.addChild(p); let y = 0;
    this.dist = readout('', { size: 'title', weight: '600' }); this.dist.position.set(0, y); p.content.addChild(this.dist); y += 40;
    const l1 = label('CRAFT', { size: 'caption', color: P.textMuted }); l1.position.set(0, y); p.content.addChild(l1); y += 20; this.craftG = new Gauge(pw - S.x2 * 2, 20, { color: P.accent }); this.craftG.position.set(0, y); p.content.addChild(this.craftG); y += 32;
    const l2 = label('UFO', { size: 'caption', color: P.textMuted }); l2.position.set(0, y); p.content.addChild(l2); y += 20; this.ufoG = new Gauge(pw - S.x2 * 2, 20, { color: P.alienOrganic }); this.ufoG.position.set(0, y); p.content.addChild(this.ufoG); y += 32;
    this.weaponsT = readout('', { size: 'body' }); this.weaponsT.position.set(0, y); p.content.addChild(this.weaponsT); y += 56;
    this.stanceBtns = []; const labels: Record<Stance, string> = { cautious: 'CAUTIOUS', standard: 'STANDARD', aggressive: 'AGGRESSIVE', disengage: 'DISENGAGE', standoff: 'STANDOFF' };
    for (const st of STANCES) { const b = button({ label: labels[st], icon: st === 'disengage' ? 'disengage' : `stance-${st}`, w: pw - S.x2 * 2, h: 44, selected: e.stance === st, variant: st === 'disengage' ? 'warn' : 'default', onTap: () => { setStance(e, st); this.stanceBtns.forEach((x, i) => x.setSelected(STANCES[i] === st)); } }); b.position.set(0, y); p.content.addChild(b); this.stanceBtns.push(b); y += 48; }
    this.logT = label('', { size: 'caption', color: P.textMuted, wrap: pw - S.x2 * 2 }); this.logT.position.set(0, y + S.x1); p.content.addChild(this.logT);
    const rp = new Panel(w - x0 - pw - S.x2 - app.safe.right - S.x2, ph, { title: 'Radar' }); rp.position.set(x0 + pw + S.x2, y0); this.root.addChild(rp); this.radar = new Graphics(); rp.content.addChild(this.radar); (this as any).rw = rp.w - S.x2 * 2; (this as any).rh = ph - S.x6 - S.x2;
    this.refresh();
  }
  private refresh() {
    const e = this.e!; const snap = snapshot(e); const s = getState(); const craft = s.craft.find((c) => c.id === e.craftId); const ufo = s.ufos.find((u) => u.id === e.ufoId);
    this.dist.text = `RANGE ${Math.round(snap.distance / DOGFIGHT.rangeScale)} km`;
    this.craftG.set(e.craft.damageMax - (craft?.damage ?? 0), e.craft.damageMax, (craft?.damage ?? 0) > e.craft.damageMax / 2 ? P.critical : P.accent);
    this.ufoG.set(e.ufo.damageMax - (ufo?.damage ?? 0), e.ufo.damageMax);
    this.weaponsT.text = snap.weapons.map((w) => (w ? `${CRAFT_WEAPONS[w.id].name} ${w.shots}/${w.hits} · ${CRAFT_WEAPONS[w.id].range} km` : 'Empty hardpoint')).join('\n');
    this.logT.text = snap.log.slice(-4).join('\n');
    const rw = (this as any).rw as number, rh = (this as any).rh as number; const g = this.radar; g.clear(); const cx = rw / 2, cy = rh - S.x3; const maxKm = 80; const R = Math.min(rw / 2 - S.x1, rh - S.x5);
    for (const r of [20, 40, 60, 80]) g.circle(cx, cy, (r / maxKm) * R).stroke({ width: 1, color: P.shell3 });
    g.poly([cx, cy - 10, cx + 8, cy + 8, cx - 8, cy + 8]).fill(P.accent);
    const d = Math.min(maxKm, snap.distance / DOGFIGHT.rangeScale); g.circle(cx, cy - (d / maxKm) * R, 8).fill(P.alienOrganic);
    for (const w of snap.weapons) if (w) g.circle(cx, cy, (Math.min(maxKm, CRAFT_WEAPONS[w.id].range) / maxKm) * R).stroke({ width: 1, color: P.accent, alpha: 0.3 });
    const km = readout(`${Math.round(snap.distance / DOGFIGHT.rangeScale)} km`, { size: 'caption', color: P.textMuted }); km.position.set(cx + 12, cy - (d / maxKm) * R - 8); (this as any).kmLabel?.destroy(); (this as any).kmLabel = km; this.radar.parent?.addChild(km);
  }
  update(dt: number) {
    const e = this.e; if (!e) return; const s = getState();
    if (e.resolved || e.outcome) { this.endTimer += dt; if (this.endTimer > 1.2 || app.testMode) { this.finish(); } return; }
    this.acc += dt * (app.testMode ? 8 : 1);
    while (this.acc >= 1) { this.acc -= 1; const events = step(s, e, 1); for (const ev of events as any[]) { if (ev.type === 'craft-shot' || ev.type === 'shot') sfx.play(ev.weapon?.includes('cannon') ? 'dogfight-cannon' : 'dogfight-missile'); if (ev.type === 'ufo-hit' || ev.type === 'craft-hit') sfx.play('dogfight-hit'); } advanceTime(s, 5); }
    this.refresh();
  }
  private finish() { if (this.done) return; this.done = true; const e = this.e!; removeEngagement(e.id); scenes.show('geoscape'); }
}
