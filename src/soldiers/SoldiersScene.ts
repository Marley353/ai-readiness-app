import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, Gauge, header, HEADER_H, modal, toast, keyValue } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, type Soldier } from '../core/state';
import { sprite, has } from '../render/atlas';
import { RANK_TITLES } from './roster';
import { ITEMS } from '../data/items';
import { assignSoldier, sackSoldier } from '../base/sim';
import { fmtDate } from '../core/clock';
import { NAMES_M, NAMES_F, NAMES_LAST } from '../data/names';
const STATS: [keyof Soldier['stats'], string][] = [['tu', 'Time units'], ['stamina', 'Stamina'], ['health', 'Health'], ['bravery', 'Bravery'], ['reactions', 'Reactions'], ['firing', 'Firing accuracy'], ['throwing', 'Throwing accuracy'], ['strength', 'Strength'], ['melee', 'Melee accuracy'], ['psiStrength', 'Psionic strength'], ['psiSkill', 'Psionic skill']];
export class SoldiersScene implements Scene {
  private root!: Container; private baseId = 0; private selected: number | null = null;
  mount(root: Container, params: any) { this.root = root; this.baseId = params?.baseId ?? getState().bases[0]?.id ?? 0; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const s = getState(); const b = s.bases.find((x) => x.id === this.baseId) ?? s.bases[0]; if (!b) { scenes.show('geoscape'); return; } const w = app.w;
    this.root.addChild(header(w, 'Soldiers', { onBack: () => scenes.back('base'), subtitle: b.name, actions: [button({ label: 'MEMORIAL', icon: 'memorial', variant: 'ghost', onTap: () => scenes.show('memorial') })] }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const ph = app.h - y0 - app.safe.bottom - S.x2; const lw = Math.min(420, Math.floor((w - x0 - app.safe.right - S.x2 * 2) / 2));
    const roster = s.soldiers.filter((so) => so.baseId === b.id); if (this.selected === null) this.selected = roster[0]?.id ?? null;
    const list = new ListView(lw, ph, { gap: 2, onTap: (i) => { this.selected = roster[i].id; this.resize(); } }); list.position.set(x0, y0); this.root.addChild(list);
    list.setRows(roster.map((so) => { const r = row(lw, 52, { selected: so.id === this.selected }); if (has(`rank/${so.rank}`)) { const sp = sprite(`rank/${so.rank}`); sp.width = 24; sp.height = 24; sp.position.set(S.x1, 14); r.addChild(sp); } const n = label(so.name, { size: 'control', weight: '600' }); n.position.set(S.x5, 6); r.addChild(n); const craft = s.craft.find((c) => c.id === so.craftId); const t = readout(`${RANK_TITLES[so.rank]} · ${so.wounded ? `WOUNDED ${so.wounded} d` : so.psiTraining ? 'PSI TRAINING' : craft ? craft.name : 'READY'} · ${so.kills} kills · ${so.missions} missions`, { size: 'caption', color: so.wounded ? P.warn : P.textMuted }); t.position.set(S.x5, 30); r.addChild(t); return r; }));
    const so = roster.find((x) => x.id === this.selected); if (!so) return;
    const px = x0 + lw + S.x2; const pw = w - px - app.safe.right - S.x2; const p = new Panel(pw, ph, { title: `${RANK_TITLES[so.rank]} ${so.name}` }); p.position.set(px, y0); this.root.addChild(p);
    const body = so.armour ? ITEMS[so.armour].armour?.unitSprite ?? 'xcom-none' : 'xcom-none'; if (has(`unit/${body}/4/idle`)) { const sp = sprite(`unit/${body}/4/idle`); sp.scale.set(2); sp.position.set(pw - S.x2 * 2 - 128, 0); p.content.addChild(sp); }
    let y = 0; const gw = Math.min(280, pw - S.x2 * 2 - 140);
    for (const [k, name] of STATS) { if (k === 'psiStrength' && !b.facilities.some((f) => f.def === 'psionic-laboratory' && f.daysLeft <= 0)) continue; const g = new Gauge(gw, 18, { caption: name, color: k === 'psiStrength' || k === 'psiSkill' ? P.alienOrganic : P.accent }); g.set(so.stats[k], k === 'firing' || k === 'throwing' || k === 'melee' ? 120 : 100); g.position.set(0, y); p.content.addChild(g); const d = so.stats[k] - so.initial[k]; if (d > 0) { const t = readout(`+${d}`, { size: 'caption', color: P.ok }); t.position.set(gw + S.x1, y); p.content.addChild(t); } y += 24; }
    y += S.x1; const btns = [button({ label: `ARMOUR: ${so.armour ? ITEMS[so.armour].name : 'None'}`, onTap: () => this.armour(so) }), button({ label: `CRAFT: ${s.craft.find((c) => c.id === so.craftId)?.name ?? 'None'}`, onTap: () => this.craft(so) }), button({ label: 'RENAME', variant: 'ghost', onTap: () => this.rename(so) }), button({ label: `PSI TRAINING ${so.psiTraining ? 'ON' : 'OFF'}`, variant: 'ghost', disabled: !b.facilities.some((f) => f.def === 'psionic-laboratory' && f.daysLeft <= 0), onTap: () => { so.psiTraining = !so.psiTraining; this.resize(); } }), button({ label: 'SACK', variant: 'danger', onTap: () => modal({ title: 'Sack soldier', body: `${so.name} will leave X-COM.`, buttons: [{ label: 'CANCEL' }, { label: 'SACK', variant: 'danger', onTap: () => { sackSoldier(s, so.id); this.selected = null; this.resize(); } }] }) })];
    let x = 0; for (const bt of btns) { if (x + bt.w > pw - S.x2 * 2) { x = 0; y += S.x6 + S.x1; } bt.position.set(x, y); p.content.addChild(bt); x += bt.w + S.x1; }
  }
  private armour(so: Soldier) { const s = getState(); const b = s.bases.find((x) => x.id === so.baseId)!; const opts = ['personal-armour', 'power-suit', 'flying-suit'].filter((id) => (b.items[id] ?? 0) > 0); const buttons: any[] = opts.map((id) => ({ label: ITEMS[id].name, onTap: () => { if (so.armour) b.items[so.armour] = (b.items[so.armour] ?? 0) + 1; b.items[id]--; so.armour = id; this.resize(); } })); buttons.push({ label: 'NONE', variant: 'ghost', onTap: () => { if (so.armour) b.items[so.armour] = (b.items[so.armour] ?? 0) + 1; so.armour = null; this.resize(); } }); modal({ title: 'Armour', body: opts.length ? 'Select armour from stores' : 'No armour in stores', buttons }); }
  private craft(so: Soldier) { const s = getState(); const crafts = s.craft.filter((c) => c.baseId === so.baseId && c.status !== 'out'); const buttons: any[] = crafts.slice(0, 3).map((c) => ({ label: c.name, onTap: () => { const r = assignSoldier(s, so.id, c.id); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } })); buttons.push({ label: 'NONE', variant: 'ghost', onTap: () => { assignSoldier(s, so.id, null); this.resize(); } }); modal({ title: 'Assign to craft', body: 'Capacity is enforced by craft type', buttons }); }
  private rename(so: Soldier) { const w = Math.min(480, app.w - S.x4); const rng = { pick: <T>(a: T[]) => a[Math.floor(Math.random() * a.length)] }; const names = Array.from({ length: 12 }, () => `${rng.pick(so.gender === 'm' ? NAMES_M : NAMES_F)} ${rng.pick(NAMES_LAST)}`); const l = new ListView(w - S.x2 * 2, 320, { onTap: (i) => { so.name = names[i]; close(); this.resize(); } }); l.setRows(names.map((n) => { const r = row(w - S.x2 * 2, 44); const t = label(n, { size: 'body' }); t.position.set(S.x1, 12); r.addChild(t); return r; })); const close = modal({ title: 'Rename', body: l, w, buttons: [{ label: 'KEEP NAME', variant: 'ghost' }] }); }
}
export class MemorialScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() { const s = getState(); const w = app.w; this.root.addChild(header(w, 'Memorial', { onBack: () => scenes.back('soldiers'), subtitle: `${s.memorial.length} fallen` })); const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const lw = w - x0 - app.safe.right - S.x2; const l = new ListView(lw, app.h - y0 - app.safe.bottom - S.x2, { gap: 2 }); l.position.set(x0, y0); this.root.addChild(l); l.setRows(s.memorial.length ? s.memorial.map((so) => { const r = row(lw, 52); const n = label(`${RANK_TITLES[so.rank]} ${so.name}`, { size: 'control', weight: '600' }); n.position.set(S.x1, 6); r.addChild(n); const t = readout(`${so.dead ? fmtDate(so.dead.date) : ''} · ${so.dead?.mission ?? ''} · ${so.dead?.cause ?? ''} · ${so.missions} missions · ${so.kills} kills`, { size: 'caption', color: P.textMuted }); t.position.set(S.x1, 30); r.addChild(t); return r; }) : [(() => { const r = row(lw, 48); const t = label('No casualties. Keep it that way.', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]); }
}
