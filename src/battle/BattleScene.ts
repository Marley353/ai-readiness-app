// Battlescape presentation: isometric renderer with pooled sprites, touch controls, HUD, animation of shots and alien turns.
import { Container, Graphics, Sprite, Text, Rectangle } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { attachGestures } from '../app/input';
import { label, readout, button, Panel, Gauge, modal, toast, icon } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { sprite, tex, has } from '../render/atlas';
import { toScreen, fromScreen, depth as depthOf, spriteFacing, TILE_W, TILE_H, LEVEL_H, VOXELS_PER_TILE as VT, VOXELS_PER_LEVEL as VL } from '../render/iso';
import * as B from './index';
import { battleHooks } from './hooks';
import type { BattleState, BattleUnit, Vec3, ShotKind, ReserveMode, Facing } from './types';
import { ITEMS } from '../data/items';
import { TERRAIN_SETS } from '../data/terrain';
import { setupFromPending } from '../scenes/flow';
import { autosave } from '../core/save';
import { sfx } from '../audio/sfx';
import { RANK_TITLES } from '../soldiers/roster';
const RESERVES: ReserveMode[] = ['none', 'snap', 'aimed', 'auto'];
export class BattleScene implements Scene {
  private root!: Container; private world = new Container(); private layers: Container[] = []; private unitLayer = new Container(); private fxLayer = new Graphics(); private hud = new Container(); private top = new Container();
  private b!: BattleState; private level = 0; private zoom = 1; private pool = new Map<number, Sprite[]>(); private unitSprites = new Map<number, Sprite>(); private dirty = true; private pathPreview: { target: Vec3; path: Vec3[]; tu: number; energy: number } | null = null; private previewG = new Graphics(); private selG = new Graphics();
  private busy = false; private aiTimer = 0; private banner: Text | null = null; private tutorial = false; private tutorialStep = 0; private hudEls: any = {}; private waypoints: Vec3[] | null = null; private fxTimer = 0;
  mount(root: Container, params: any) {
    this.root = root; const s = getState();
    if (params?.setup) { const setup = params.setup; const base = s.bases.find((x) => x.id === setup.baseId) ?? s.bases[0]; s.battle = B.createBattle(setup, s.soldiers, base); void autosave('mission'); }
    else if (params?.siteId !== undefined || params?.kind) { const site = s.sites.find((x) => x.id === params.siteId); const pm = { siteId: params.siteId, craftId: params.craftId, baseId: params.baseId, kind: params.kind ?? site?.kind ?? 'crash' }; const setup = setupFromPending(pm); if (!setup) { toast('Mission could not be prepared', 'warn'); scenes.show('geoscape'); return; } s.pendingMission = s.pendingMission ?? pm; const base = s.bases.find((x) => x.id === setup.baseId) ?? s.bases[0]; s.battle = B.createBattle(setup, s.soldiers, base); void autosave('mission'); }
    else if (params?.pending && s.pendingMission) { const setup = setupFromPending(s.pendingMission); if (!setup) { toast('Mission could not be prepared', 'warn'); scenes.show('geoscape'); return; } const base = s.bases.find((x) => x.id === setup.baseId) ?? s.bases[0]; s.battle = B.createBattle(setup, s.soldiers, base); void autosave('mission'); }
    else if (!s.battle) { if (s.pendingMission) { const setup = setupFromPending(s.pendingMission); if (setup) { s.battle = B.createBattle(setup, s.soldiers, s.bases[0]); void autosave('mission'); } } if (!s.battle) { scenes.show('geoscape'); return; } }
    this.b = s.battle!; this.tutorial = !!params?.tutorial || this.b.setup.missionType === 'tutorial';
    for (let z = 0; z < this.b.map.levels; z++) { const l = new Container(); l.sortableChildren = true; this.layers.push(l); this.world.addChild(l); }
    this.world.addChild(this.previewG, this.selG, this.unitLayer, this.fxLayer); this.unitLayer.sortableChildren = true;
    root.addChild(this.world, this.hud, this.top);
    const hit = new Container(); hit.eventMode = 'static'; hit.hitArea = new Rectangle(-100000, -100000, 200000, 200000); this.world.addChildAt(hit, 0);
    attachGestures(this.world, { tap: (x, y) => this.tap(x, y), longPress: (x, y) => this.longPress(x, y), twoFingerTap: (x, y) => this.twoFinger(x, y), pan: (dx, dy) => { this.world.x += dx; this.world.y += dy; this.dirty = true; }, pinch: (k) => { const z = k > 1 ? 2 : k < 1 ? 1 : this.zoom; if (z !== this.zoom) { this.zoom = z; this.world.scale.set(z); this.dirty = true; } } });
    const sel = B.unitByUid(this.b, this.b.selectedUid ?? -1) ?? B.unitsOf(this.b, 'xcom')[0]; if (sel) { this.b.selectedUid = sel.uid; this.level = sel.pos.z; this.centreOn(sel.pos); }
    battleHooks.perf = () => this.perf(); battleHooks.perfReset = () => this.perfReset(); battleHooks.fps = () => Math.round(app.pixi.ticker.FPS); battleHooks.setLevel = (z: number) => { this.level = z; this.dirty = true; }; battleHooks.runAiTurnAnimated = () => { if (this.b.side === 'xcom') this.endTurn(); };
    this.buildHud(); this.brief(); sfx.music(this.b.map.night ? 'ambient-battle-night' : 'ambient-battle-day'); sfx.play('mission-start');
  }
  unmount() {}
  resize() { this.buildHud(); this.dirty = true; }
  private centreOn(p: Vec3) { const sc = toScreen(p.x, p.y, p.z); this.world.x = Math.round(app.w * 0.42 - sc.sx * this.zoom); this.world.y = Math.round(app.h * 0.45 - sc.sy * this.zoom); this.dirty = true; }
  private tileFromGlobal(gx: number, gy: number, z = this.level): Vec3 | null { const l = this.world.toLocal({ x: gx, y: gy }); const t = fromScreen(l.x, l.y, z); const p = { x: Math.floor(t.x), y: Math.floor(t.y), z }; return B.inMap(this.b.map, p.x, p.y, p.z) ? p : null; }
  private selected(): BattleUnit | null { return B.unitByUid(this.b, this.b.selectedUid ?? -1) ?? null; }
  // ---------- rendering ----------
  private perfSamples: number[] = [];
  perf() { const a = [...this.perfSamples].sort((x, y) => x - y); return { updateP95: a.length ? +a[Math.floor(a.length * 0.95)].toFixed(2) : 0, samples: a.length }; }
  perfReset() { this.perfSamples.length = 0; }
  update(dt: number) {
    const t0 = performance.now(); try { this.updateInner(dt); } finally { const ms = performance.now() - t0; if (this.perfSamples.length < 2000) this.perfSamples.push(ms); }
  }
  private updateInner(dt: number) {
    const b = this.b; if (!b) return;
    if (b.side !== 'xcom' && !b.ended) { this.aiTimer -= dt; if (this.aiTimer <= 0 || app.reducedMotion) this.aiTick(); }
    if (this.fxTimer > 0) { this.fxTimer -= dt; if (this.fxTimer <= 0) this.fxLayer.clear(); }
    if (this.dirty) { this.render(); this.dirty = false; }
    this.refreshHud();
  }
  private render() {
    const b = this.b; const m = b.map; const view = { x0: -this.world.x / this.zoom - TILE_W, y0: -this.world.y / this.zoom - TILE_H * 4, x1: (app.w - this.world.x) / this.zoom + TILE_W, y1: (app.h - this.world.y) / this.zoom + LEVEL_H * 4 };
    const used = new Set<number>();
    for (let z = 0; z < m.levels; z++) {
      const layer = this.layers[z]; layer.visible = z <= this.level; if (z > this.level) continue;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const sc = toScreen(x, y, z); if (sc.sx < view.x0 || sc.sx > view.x1 || sc.sy < view.y0 || sc.sy > view.y1) continue;
        const i = B.tileIndex(m, x, y, z); const t = m.tiles[i]; if (!t.seen && !app.testMode) continue; if (!t.floor && !t.wallN && !t.wallW && !t.object) continue;
        used.add(i); let sprites = this.pool.get(i); if (!sprites) { sprites = []; this.pool.set(i, sprites); }
        const parts: { key: string; tint: number; ax: number; ay: number; layer: number }[] = [];
        const set = TERRAIN_SETS[m.terrainSet]; const defOf = (id: string | null) => (id ? B.tileDefOf(b, id) : undefined);
        const add = (id: string | null, layerIdx: number, anchorY: number) => { const d = defOf(id); if (!d) return; for (const pp of d.parts) parts.push({ key: pp.shape, tint: (P as any)[pp.tint] ?? 0xffffff, ax: 0.5, ay: anchorY - (pp.dz ?? 0) / 40, layer: layerIdx }); };
        add(t.floor, 0, 0.5); add(t.wallN, 1, 1 - TILE_H / 2 / 80); add(t.wallW, 1, 1 - TILE_H / 2 / 80); add(t.object, 2, 1 - 8 / 64);
        if (t.smoke > 0) parts.push({ key: `fx/smoke${Math.min(3, t.smoke - 1)}`, tint: 0xffffff, ax: 0.5, ay: 0.9, layer: 3 }); if (t.fire > 0) parts.push({ key: `fx/fire${Math.min(2, t.fire - 1)}`, tint: 0xffffff, ax: 0.5, ay: 0.9, layer: 3 }); if ((t.stunGas ?? 0) > 0) parts.push({ key: `fx/stun${Math.min(2, (t.stunGas ?? 1) - 1)}`, tint: 0xffffff, ax: 0.5, ay: 0.9, layer: 3 });
        for (let k = 0; k < parts.length; k++) { let sp = sprites[k]; if (!sp) { sp = new Sprite(); sprites[k] = sp; layer.addChild(sp); } const pt = parts[k]; const tx = tex(pt.key); if (sp.texture !== tx) sp.texture = tx; sp.anchor.set(pt.ax, pt.ay); sp.position.set(sc.sx, sc.sy + TILE_H / 2); sp.tint = t.visible || app.testMode ? pt.tint : this.darken(pt.tint); sp.alpha = pt.layer === 3 ? 0.8 : 1; sp.zIndex = depthOf(x, y, z, pt.layer); sp.visible = true; if (sp.parent !== layer) layer.addChild(sp); }
        for (let k = parts.length; k < sprites.length; k++) sprites[k].visible = false;
        if (t.doorOpen) { const d = sprites[1]; if (d) d.alpha = 0.35; }
      }
    }
    for (const [i, sprites] of this.pool) if (!used.has(i)) for (const sp of sprites) sp.visible = false;
    // units
    const seen = new Set<number>();
    for (const u of b.units) {
      const tile = B.tileAt(b, u.pos.x, u.pos.y, u.pos.z); const visible = u.faction === 'xcom' || (tile?.visible ?? false) || app.testMode; if (!visible || u.pos.z > this.level) { const sp = this.unitSprites.get(u.uid); if (sp) sp.visible = false; continue; }
      seen.add(u.uid); let sp = this.unitSprites.get(u.uid); if (!sp) { sp = new Sprite(); this.unitSprites.set(u.uid, sp); this.unitLayer.addChild(sp); }
      const f = spriteFacing(u.facing); const anim = u.status === 'dead' || u.status === 'unconscious' ? 'dead' : u.kneeling ? 'kneel' : 'idle'; let key = `unit/${u.unitSprite}/${f.facing}/${anim}`; if (!has(key)) key = `unit/${u.unitSprite}/${f.facing}/idle`;
      sp.texture = tex(key); sp.anchor.set(0.5, u.size === 2 ? 44 / 48 : 30 / 32); const sc = toScreen(u.pos.x + (u.size === 2 ? 0.5 : 0), u.pos.y + (u.size === 2 ? 0.5 : 0), u.pos.z); sp.position.set(sc.sx, sc.sy + TILE_H / 2); sp.scale.x = f.mirror ? -1 : 1; sp.zIndex = depthOf(u.pos.x + (u.size === 2 ? 1 : 0), u.pos.y + (u.size === 2 ? 1 : 0), u.pos.z, 4); sp.visible = true; sp.tint = 0xffffff;
    }
    for (const [uid, sp] of this.unitSprites) if (!seen.has(uid)) sp.visible = false;
    // selection + enemies markers
    const g = this.selG; g.clear(); const sel = this.selected(); if (sel) { const sc = toScreen(sel.pos.x, sel.pos.y, sel.pos.z); g.poly([sc.sx, sc.sy, sc.sx + TILE_W / 2, sc.sy + TILE_H / 2, sc.sx, sc.sy + TILE_H, sc.sx - TILE_W / 2, sc.sy + TILE_H / 2]).stroke({ width: 2, color: P.accent }); }
    for (const u of b.units) if (u.faction === 'alien' && !B.isOut(u) && (B.tileAt(b, u.pos.x, u.pos.y, u.pos.z)?.visible || app.testMode) && u.pos.z <= this.level) { const sc = toScreen(u.pos.x, u.pos.y, u.pos.z); g.circle(sc.sx, sc.sy + TILE_H / 2, 5).fill(P.alienOrganic); }
    const pg = this.previewG; pg.clear(); if (this.pathPreview) { for (const p of this.pathPreview.path) { const sc = toScreen(p.x, p.y, p.z); pg.poly([sc.sx, sc.sy, sc.sx + TILE_W / 2, sc.sy + TILE_H / 2, sc.sx, sc.sy + TILE_H, sc.sx - TILE_W / 2, sc.sy + TILE_H / 2]).fill({ color: P.accent, alpha: 0.25 }).stroke({ width: 1, color: P.accent, alpha: 0.7 }); } }
    if (this.waypoints) for (const p of this.waypoints) { const sc = toScreen(p.x, p.y, p.z); pg.circle(sc.sx, sc.sy + TILE_H / 2, 6).fill(P.plasmaHot); }
  }
  private darken(c: number) { const r = ((c >> 16) & 255) * 0.55, g = ((c >> 8) & 255) * 0.55, bb = (c & 255) * 0.55; return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bb); }
  private flashShot(from: Vec3, to: Vec3, color: number) { if (app.reducedMotion) return; const a = { x: from.x / VT, y: from.y / VT, z: from.z / VL }, c = { x: to.x / VT, y: to.y / VT, z: to.z / VL }; const s1 = toScreen(a.x, a.y, a.z), s2 = toScreen(c.x, c.y, c.z); this.fxLayer.moveTo(s1.sx, s1.sy + TILE_H / 2 - 20).lineTo(s2.sx, s2.sy + TILE_H / 2 - 12).stroke({ width: 2, color }); this.fxTimer = 0.18; }
  private showResult(r: B.FireResult) { if (!r.ok) { toast(r.reason ?? 'Cannot fire', 'warn'); return; } sfx.play(r.sound); for (const sh of r.shots) { const col = r.sound.includes('plasma') ? P.plasmaHot : r.sound.includes('laser') ? P.techAccent : P.text; this.flashShot(sh.origin, sh.end, col); if (sh.explosion) { const sc = toScreen(sh.explosion.centre.x, sh.explosion.centre.y, sh.explosion.centre.z); this.fxLayer.circle(sc.sx, sc.sy + TILE_H / 2, sh.explosion.radius * 12).fill({ color: P.fire, alpha: 0.5 }); this.fxTimer = 0.3; sfx.play(sh.explosion.power > 80 ? 'explode-large' : 'explode-small'); } if (sh.hit.kind === 'unit') sfx.play('hit-flesh'); else if (sh.hit.kind === 'wall' || sh.hit.kind === 'object') sfx.play('hit-wall'); if (sh.killed) toast(`${sh.hit.unit?.name ?? 'Target'} killed`); } this.dirty = true; this.checkEnd(); }
  // ---------- input ----------
  private tap(gx: number, gy: number) {
    if (this.busy || this.b.side !== 'xcom' || this.b.ended) return; const p = this.tileFromGlobal(gx, gy); if (!p) return;
    if (this.waypoints) { this.waypoints.push(p); this.dirty = true; if (this.waypoints.length >= 8) this.launch(); return; }
    const u = B.unitAt(this.b, p.x, p.y, p.z); const sel = this.selected();
    if (u && u.faction === 'xcom' && !B.isOut(u)) { this.b.selectedUid = u.uid; this.pathPreview = null; this.dirty = true; return; }
    if (!sel || B.isOut(sel)) return;
    if (u && u.faction !== 'xcom' && (B.tileAt(this.b, u.pos.x, u.pos.y, u.pos.z)?.visible || app.testMode)) { this.fireMenu(sel, u.pos); return; }
    if (this.pathPreview && this.pathPreview.target.x === p.x && this.pathPreview.target.y === p.y && this.pathPreview.target.z === p.z) { void this.walk(sel, this.pathPreview.path); this.pathPreview = null; return; }
    const path = B.pathTo(this.b, sel, p); if (!path) { toast('No route', 'warn'); this.pathPreview = null; this.dirty = true; return; }
    this.pathPreview = { target: p, path: path.path, tu: path.tu, energy: path.energy }; this.dirty = true; this.hudEls.preview.text = `TU ${path.tu} · EN ${path.energy}${path.tu > sel.tu ? ' — NOT ENOUGH TU' : ''}`;
  }
  private async walk(u: BattleUnit, path: Vec3[]) {
    this.busy = true; let i = 0;
    for (const step of path) { const r = B.stepUnit(this.b, u, step); if (!r.ok) { toast(r.reason ?? 'Stopped', 'warn'); break; } u.movedThisTurn = (u.movedThisTurn ?? 0) + 1; if (r.door) sfx.play('door-open'); sfx.play('step-soft', { volume: 0.5 }); this.dirty = true; if (r.reactions.length) { for (const rr of r.reactions) { this.showResult(rr); } toast('Reaction fire'); break; } if (r.spotted.length) { toast('Alien sighted'); break; } if (B.isOut(u)) break; if (!app.reducedMotion) await new Promise((res) => setTimeout(res, 80)); if (++i > 200) break; }
    this.level = u.pos.z; this.busy = false; this.dirty = true; this.checkEnd();
  }
  private fireMenu(u: BattleUnit, target: Vec3) {
    const w = B.weaponInHands(this.b, u); if (!w) { toast('No weapon in hand', 'warn'); return; } const d = ITEMS[w.def]; const kinds: ShotKind[] = (['snap', 'aimed', 'auto', 'melee'] as ShotKind[]).filter((k) => B.modeOf(w.def, k));
    const buttons = kinds.map((k) => { const m = B.modeOf(w.def, k)!; const cost = B.tuCostPct(u, m.tu); return { label: `${k.toUpperCase()} · ${cost} TU · ${B.accuracyFor(this.b, u, w, k)}%`, variant: (cost <= u.tu ? 'primary' : 'ghost') as any, onTap: () => { const r = B.fire(this.b, u, k, target, w.uid); this.showResult(r); } }; });
    if (d.guided) buttons.push({ label: 'LAUNCH WITH WAYPOINTS', variant: 'primary', onTap: () => { this.waypoints = []; toast('Tap up to 8 waypoints, then LAUNCH'); } });
    modal({ title: `${d.name}${w.ammo ? ` · ${w.rounds} rounds` : d.ammo?.length ? ' · EMPTY' : ''}`, body: `Target at ${target.x},${target.y}`, buttons: [...buttons.slice(0, 3), { label: 'CANCEL', variant: 'ghost' }] });
  }
  private launch() { const sel = this.selected(); if (!sel || !this.waypoints?.length) { this.waypoints = null; return; } const r = B.launch(this.b, sel, this.waypoints); this.waypoints = null; this.showResult(r); }
  private longPress(gx: number, gy: number) {
    if (this.busy || this.b.side !== 'xcom' || this.b.ended) return; const p = this.tileFromGlobal(gx, gy); const sel = this.selected(); if (!p || !sel) return;
    const items = sel.items.map((id) => B.itemByUid(this.b, id)!); const grenade = items.find((i) => ITEMS[i.def].battleType === 'grenade' || ITEMS[i.def].battleType === 'proximity' || i.def === 'electro-flare'); const scanner = items.find((i) => i.def === 'motion-scanner'); const kit = items.find((i) => i.def === 'medi-kit'); const w = B.weaponInHands(this.b, sel);
    const buttons: any[] = [{ label: 'MOVE HERE', onTap: () => { const path = B.pathTo(this.b, sel, p); if (path) void this.walk(sel, path.path); else toast('No route', 'warn'); } }, { label: 'TURN TO FACE', onTap: () => { const r = B.turnUnit(this.b, sel, B.facingTo(sel.pos, p)); if (!r.ok) toast(r.reason!, 'warn'); for (const rr of r.reactions) this.showResult(rr); this.dirty = true; } }];
    if (grenade) buttons.push({ label: `${grenade.primed !== undefined && grenade.primed >= 0 ? 'THROW' : 'PRIME & THROW'} ${ITEMS[grenade.def].name}`, onTap: () => { if (ITEMS[grenade.def].battleType !== 'flare' && (grenade.primed === undefined || grenade.primed < 0)) { const pr = B.primeGrenade(this.b, sel, grenade.uid, 0); if (!pr.ok) { toast(pr.reason!, 'warn'); return; } sfx.play('prime'); } const r = B.throwItem(this.b, sel, grenade.uid, p); this.showResult(r); } });
    if (scanner) buttons.push({ label: 'MOTION SCAN', onTap: () => { const r = B.useScanner(this.b, sel); if (!r.ok) { toast(r.reason!, 'warn'); return; } sfx.play('scanner'); toast(`${r.blips.length} moving contacts within 9 tiles`); const g = this.previewG; for (const bl of r.blips) { const sc = toScreen(bl.x, bl.y, bl.z); g.circle(sc.sx, sc.sy + TILE_H / 2, 4 + bl.size * 3).fill({ color: P.warn, alpha: 0.8 }); } } });
    if (kit) { const target = B.unitAt(this.b, p.x, p.y, p.z) ?? sel; buttons.push({ label: `MEDI-KIT ON ${target.name === sel.name ? 'SELF' : target.name}`, onTap: () => { const r = B.useMedikit(this.b, sel, target, Object.values(target.wounds).some((x) => x > 0) ? 'heal' : target.status === 'unconscious' ? 'stimulant' : 'painkiller'); toast(r.ok ? 'Treated' : r.reason!, r.ok ? 'info' : 'warn'); if (r.ok) sfx.play('medikit'); this.dirty = true; } }); }
    if (w && ITEMS[w.def].guided) buttons.push({ label: 'BLASTER WAYPOINTS', onTap: () => { this.waypoints = []; toast('Tap up to 8 waypoints, then LAUNCH'); } });
    modal({ title: `${sel.name} — tile ${p.x},${p.y}`, body: `TU ${sel.tu} · Energy ${sel.energy}`, buttons: [...buttons.slice(0, 3), { label: 'CANCEL', variant: 'ghost' }] });
  }
  private twoFinger(gx: number, gy: number) { const p = this.tileFromGlobal(gx, gy); const sel = this.selected(); if (!p || !sel || this.busy || this.b.side !== 'xcom') return; const u = B.unitAt(this.b, p.x, p.y, p.z); if (u && u.faction === 'xcom') { scenes.show('inventory', { battle: true, uid: u.uid }); return; } const r = B.turnUnit(this.b, sel, B.facingTo(sel.pos, p)); if (!r.ok) toast(r.reason!, 'warn'); for (const rr of r.reactions) this.showResult(rr); this.dirty = true; }
  // ---------- turns ----------
  private endTurn() {
    if (this.busy || this.b.side !== 'xcom') return; const withTu = B.unitsOf(this.b, 'xcom').filter((u) => u.tu > 10 && !B.isOut(u)).length; const go = () => { this.pathPreview = null; B.endTurn(this.b); this.aiTimer = 0; this.banner!.text = 'ALIEN TURN'; this.banner!.visible = true; this.dirty = true; };
    if (withTu > 0 && !getState().options.autoEndTurn && !app.testMode) modal({ title: 'End turn', body: `${withTu} soldiers still have time units.`, buttons: [{ label: 'CANCEL' }, { label: 'END TURN', variant: 'primary', onTap: go }] }); else go();
  }
  private aiTick() {
    const b = this.b; const a = B.aiStep(b); this.aiTimer = app.reducedMotion ? 0 : 0.12;
    if (!a || a.type === 'end') { const r = B.endTurn(b); if (b.side === 'xcom') { this.banner!.visible = false; for (const e of r.events) toast(e.text, e.kind === 'died' ? 'critical' : 'warn'); const sel = B.unitsOf(b, 'xcom').find((u) => !B.isOut(u)); if (sel) { b.selectedUid = sel.uid; } sfx.play('ui-alert'); } this.dirty = true; this.checkEnd(); return; }
    if (a.type === 'fire' || a.type === 'melee' || a.type === 'throw') { if (a.result.ok) { const vis = a.result.shots.some((sh) => sh.hit.unit?.faction === 'xcom') || B.unitByUid(b, a.uid)?.visibleTo.length; if (vis) this.showResult(a.result); } for (const rr of (a as any).result?.reactions ?? []) this.showResult(rr); }
    if (a.type === 'move' && a.result?.reactions?.length) for (const rr of a.result.reactions) this.showResult(rr);
    if (a.type === 'psi') toast(a.success ? `Psionic attack: ${a.kind}` : 'A psionic attack is resisted', a.success ? 'critical' : 'info');
    this.dirty = true;
  }
  private checkEnd() { const e = B.checkMissionEnd(this.b); if (!e) return; if (this.b.setup.missionType === 'cydonia-surface' && e.winner === 'xcom') { toast('Surface secured. Descend to the brain.'); } this.busy = true; setTimeout(() => scenes.show('debrief'), app.reducedMotion ? 0 : 900); }
  private abort() { modal({ title: 'Abort mission', body: 'Soldiers outside the craft will be left behind.', buttons: [{ label: 'CANCEL' }, { label: 'ABORT', variant: 'danger', onTap: () => { B.abortMission(this.b); scenes.show('debrief'); } }] }); }
  // ---------- HUD ----------
  private buildHud() {
    this.hud.removeChildren().forEach((c) => c.destroy({ children: true })); this.top.removeChildren().forEach((c) => c.destroy({ children: true }));
    const w = app.w; const H = 112; const y = app.h - app.safe.bottom - H; const p = new Panel(w, H + app.safe.bottom, { pad: S.x1 }); p.position.set(0, y); this.hud.addChild(p); const c = p.content; const E: any = this.hudEls = {};
    const hand = (slot: 'leftHand' | 'rightHand', x: number) => { const bt = button({ label: '', w: 88, h: 88, onTap: () => { const sel = this.selected(); if (!sel) return; const it = B.handItem(this.b, sel, slot); if (!it) { scenes.show('inventory', { battle: true, uid: sel.uid }); return; } const d = ITEMS[it.def]; if (d.battleType === 'firearm' || d.battleType === 'melee') toast('Tap a visible alien to fire'); else if (d.battleType === 'grenade') { const pr = B.primeGrenade(this.b, sel, it.uid, 0); toast(pr.ok ? 'Grenade primed: long-press a tile to throw' : pr.reason!, pr.ok ? 'info' : 'warn'); } else if (d.battleType === 'medikit') toast('Long-press a soldier to treat'); else scenes.show('inventory', { battle: true, uid: sel.uid }); } }); bt.position.set(x, 0); c.addChild(bt); const sp = new Sprite(); sp.width = 56; sp.height = 56; sp.position.set(x + 16, 8); c.addChild(sp); const r = readout('', { size: 'caption', weight: '600' }); r.position.set(x + 6, 68); c.addChild(r); return { bt, sp, r }; };
    E.left = hand('leftHand', app.safe.left + 0); E.right = hand('rightHand', app.safe.left + 96);
    E.name = label('', { size: 'control', weight: '600' }); E.name.position.set(app.safe.left + 200, 0); c.addChild(E.name);
    E.tu = new Gauge(160, 16, { caption: 'TU', color: P.accent }); E.tu.position.set(app.safe.left + 200, 24); c.addChild(E.tu); E.en = new Gauge(160, 16, { caption: 'EN', color: P.warn }); E.en.position.set(app.safe.left + 200, 44); c.addChild(E.en); E.hp = new Gauge(160, 16, { caption: 'HP', color: P.critical }); E.hp.position.set(app.safe.left + 200, 64); c.addChild(E.hp); E.mo = new Gauge(160, 16, { caption: 'MO', color: P.alienOrganic }); E.mo.position.set(app.safe.left + 200, 84); c.addChild(E.mo);
    E.preview = readout('', { size: 'caption', color: P.accent }); E.preview.position.set(app.safe.left + 372, 0); c.addChild(E.preview);
    let x = app.safe.left + 372; const bw = 48; const mk = (ic: string, lab: string, fn: () => void, wdt = bw) => { const bt = button({ icon: ic, label: lab || undefined, w: wdt, h: 44, size: 'caption', onTap: fn }); bt.position.set(x, 24); c.addChild(bt); x += wdt + S.half; return bt; };
    mk('kneel', '', () => { const sel = this.selected(); if (!sel) return; const r = B.kneel(this.b, sel); if (!r.ok) toast(r.reason!, 'warn'); else sfx.play('kneel'); this.dirty = true; });
    E.reserve = mk('reserve-none', 'RES', () => { const sel = this.selected(); if (!sel) return; const i = RESERVES.indexOf(sel.reserve ?? 'none'); sel.reserve = RESERVES[(i + 1) % 4]; this.b.reserve = sel.reserve; toast(`Reserve TU: ${sel.reserve}`); }, 72);
    mk('prev-unit', '', () => this.cycle(-1)); mk('next-unit', '', () => this.cycle(1));
    mk('inventory', '', () => { const sel = this.selected(); if (sel) scenes.show('inventory', { battle: true, uid: sel.uid }); });
    mk('level-down', '', () => { this.level = Math.max(0, this.level - 1); this.dirty = true; }); mk('level-up', '', () => { this.level = Math.min(this.b.map.levels - 1, this.level + 1); this.dirty = true; });
    mk('centre', '', () => { const sel = this.selected(); if (sel) { this.level = sel.pos.z; this.centreOn(sel.pos); } });
    mk('zoom-in', '', () => { this.zoom = this.zoom === 1 ? 2 : 1; this.world.scale.set(this.zoom); this.dirty = true; });
    E.waypoint = mk('launch', 'LAUNCH', () => this.launch(), 96); E.waypoint.visible = false;
    const et = button({ label: 'END TURN', icon: 'end-turn', w: 128, h: 44, variant: 'primary', onTap: () => this.endTurn() }); et.position.set(w - app.safe.right - S.x1 - 128, 24); c.addChild(et);
    const ab = button({ icon: 'abort', label: 'ABORT', w: 96, h: 44, variant: 'danger', size: 'caption', onTap: () => this.abort() }); ab.position.set(w - app.safe.right - S.x1 - 128 - S.half - 96, 24); c.addChild(ab);
    const opt = button({ icon: 'options', w: 48, h: 44, variant: 'ghost', onTap: () => scenes.show('options') }); opt.position.set(w - app.safe.right - S.x1 - 128 - S.half - 96 - S.half - 48, 24); c.addChild(opt);
    E.turn = readout('', { size: 'caption', color: P.textMuted }); E.turn.position.set(w - app.safe.right - S.x1 - 280, 76); c.addChild(E.turn);
    this.banner = label('ALIEN TURN', { size: 'title', weight: '600', color: P.alienOrganic, align: 'center' }); this.banner.position.set(Math.round(w / 2), app.safe.top + S.x2); this.banner.visible = this.b.side !== 'xcom'; this.top.addChild(this.banner);
    const title = label(`${this.b.setup.missionType.toUpperCase()} · ${this.b.map.night ? 'NIGHT' : 'DAY'} · ${this.b.setup.alienRace}`, { size: 'caption', color: P.textMuted }); title.position.set(app.safe.left + S.x2, app.safe.top + S.x1); this.top.addChild(title);
    this.refreshHud();
  }
  private refreshHud() {
    const E = this.hudEls; if (!E.name) return; const sel = this.selected(); const b = this.b;
    E.turn.text = `TURN ${b.turn} · ${b.side.toUpperCase()} · LEVEL ${this.level + 1}`;
    if (!sel) { E.name.text = 'No unit selected'; return; }
    const so = getState().soldiers.find((s) => s.id === sel.soldierId); E.name.text = `${so ? RANK_TITLES[so.rank] + ' ' : ''}${sel.name}${sel.kneeling ? ' (kneeling)' : ''}${sel.status === 'panicking' ? ' PANIC' : ''}`;
    E.tu.set(sel.tu, sel.stats.tu); E.en.set(sel.energy, sel.stats.stamina); E.hp.set(sel.health, sel.stats.health, sel.health < sel.stats.health / 3 ? P.critical : P.ok); E.mo.set(sel.morale, 100, sel.morale < 50 ? P.warn : P.alienOrganic);
    for (const [slot, el] of [['leftHand', E.left], ['rightHand', E.right]] as const) { const it = B.handItem(b, sel, slot); if (it) { el.sp.texture = tex(ITEMS[it.def].sprite); el.sp.visible = true; el.r.text = it.ammo || ITEMS[it.def].clipSize === 0 ? `${ITEMS[it.def].ammo?.length || ITEMS[it.def].clipSize ? it.rounds : '∞'}` : ITEMS[it.def].category === 'ammo' ? String(it.rounds) : ''; } else { el.sp.visible = false; el.r.text = ''; } }
    if (!this.pathPreview) E.preview.text = ''; E.waypoint.visible = !!this.waypoints;
    if (E.reserve) E.reserve.setLabel(`RES ${(sel.reserve ?? 'none').toUpperCase()}`);
  }
  private cycle(d: number) { const list = B.unitsOf(this.b, 'xcom').filter((u) => !B.isOut(u)); if (!list.length) return; const i = list.findIndex((u) => u.uid === this.b.selectedUid); const n = list[(i + d + list.length) % list.length]; this.b.selectedUid = n.uid; this.level = n.pos.z; this.centreOn(n.pos); this.pathPreview = null; }
  private brief() {
    const b = this.b; const s = getState(); const body = `${b.setup.missionType === 'tutorial' ? 'Training exercise' : b.setup.missionType.replace('-', ' ')} · ${b.map.terrainSet} · ${b.map.night ? 'night' : 'day'}\n${B.unitsOf(b, 'xcom').length} operatives · aliens: ${s.bases.some((x) => x.facilities.some((f) => f.def === 'hyper-wave-decoder' && f.daysLeft <= 0)) || b.setup.missionType === 'tutorial' ? b.setup.alienRace : 'unknown'}\n\nTap a soldier to select. Tap a tile to preview the route and its TU cost, tap again to move. Tap an alien to fire. Long-press for actions. Two-finger tap turns to face.`;
    modal({ title: 'Mission briefing', body, buttons: [{ label: 'DEPLOY', variant: 'primary', onTap: () => { if (this.tutorial) this.tutorialCard(); } }] });
  }
  private tutorialCard() { const steps = ['1 · SELECT: tap one of your soldiers by the ramp.', '2 · MOVE: tap a tile to see the route and TU cost, tap it again to walk. Moving in the open costs 4 TU per tile.', '3 · FIRE: when an alien is visible, tap it and choose Snap, Aimed or Auto. Kneel first for better accuracy.', '4 · REACTION: aliens react on your turn if their reactions beat yours. End your turn with TU in reserve.', '5 · END TURN: when everyone has acted, tap END TURN. Win by neutralising every alien.']; if (this.tutorialStep >= steps.length) return; modal({ title: 'Tutorial', body: steps[this.tutorialStep], buttons: [{ label: 'SKIP TUTORIAL', variant: 'ghost', onTap: () => { this.tutorialStep = 99; } }, { label: 'NEXT', variant: 'primary', onTap: () => { this.tutorialStep++; if (this.tutorialStep < steps.length) setTimeout(() => this.tutorialCard(), 0); } }] }); }
}
