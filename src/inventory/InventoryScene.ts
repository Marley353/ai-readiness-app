import { Container, Graphics } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, header, HEADER_H, toast } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, type Soldier } from '../core/state';
import { sprite, has } from '../render/atlas';
import { ITEMS } from '../data/items';
import { SLOTS, SLOT_IDS, fits, occupiedCells, weightOf, tuMove } from './layout';
import type { InvSlot, BattleItem, BattleUnit } from '../battle/types';
import * as B from '../battle/index';
const CELL = 48;
const SLOT_POS: Record<InvSlot, [number, number]> = { rightShoulder: [0, 0], leftShoulder: [280, 0], rightHand: [0, 72], leftHand: [280, 72], belt: [96, 232], rightLeg: [0, 232], leftLeg: [280, 232], backpack: [280, 304], ground: [0, 400] };
interface Placed { key: number; def: string; slot: InvSlot; gx: number; gy: number; ammo?: string; rounds?: number }
export class InventoryScene implements Scene {
  private root!: Container; private soldierId = 0; private battle = false; private uid = 0; private lifted: Placed | null = null; private baseId = 0;
  mount(root: Container, params: any) { this.root = root; this.battle = !!params?.battle; this.uid = params?.uid ?? 0; this.soldierId = params?.soldierId ?? getState().soldiers[0]?.id ?? 0; this.baseId = params?.baseId ?? getState().bases[0]?.id ?? 0; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private items(): Placed[] {
    const s = getState();
    if (this.battle && s.battle) { const u = B.unitByUid(s.battle, this.uid); if (!u) return []; const own = u.items.map((id) => B.itemByUid(s.battle!, id)!).map((it) => ({ key: it.uid, def: it.def, slot: it.slot ?? 'ground', gx: it.gx ?? 0, gy: it.gy ?? 0, ammo: it.ammo, rounds: it.rounds })); const ground = B.itemsAt(s.battle, u.pos).map((it, i) => ({ key: it.uid, def: it.def, slot: 'ground' as InvSlot, gx: (i % 6) * 2, gy: Math.floor(i / 6) * 3, ammo: it.ammo, rounds: it.rounds })); return [...own, ...ground]; }
    const so = s.soldiers.find((x) => x.id === this.soldierId); if (!so) return []; const eq = so.equipment.map((e, i) => ({ key: i, def: e.def, slot: e.slot, gx: e.gx ?? 0, gy: e.gy ?? 0, ammo: e.ammo, rounds: e.rounds }));
    const pool = s.bases.find((b) => b.id === so.baseId)?.items ?? {}; let i = 0; const ground: Placed[] = []; for (const [id, n] of Object.entries(pool)) { if (n <= 0 || !ITEMS[id] || !['weapon', 'ammo', 'grenade', 'equipment'].includes(ITEMS[id].category)) continue; ground.push({ key: 1000 + i, def: id, slot: 'ground', gx: (i % 6) * 2, gy: Math.floor(i / 6) * 3, rounds: n }); i++; }
    return [...eq, ...ground];
  }
  private build() {
    const s = getState(); const w = app.w; const items = this.items(); const so = s.soldiers.find((x) => x.id === this.soldierId); const unit = this.battle && s.battle ? B.unitByUid(s.battle, this.uid) : undefined;
    const name = unit?.name ?? so?.name ?? 'Soldier';
    this.root.addChild(header(w, `Equipment — ${name}`, { onBack: () => scenes.back(this.battle ? 'battle' : 'soldiers'), actions: this.battle ? [] : [button({ label: 'PREV', icon: 'prev-unit', variant: 'ghost', onTap: () => this.cycle(-1) }), button({ label: 'NEXT', icon: 'next-unit', variant: 'ghost', onTap: () => this.cycle(1) })] }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const layer = new Container(); layer.position.set(x0, y0); this.root.addChild(layer);
    const body = unit?.unitSprite ?? (so?.armour ? ITEMS[so.armour].armour?.unitSprite : 'xcom-none') ?? 'xcom-none'; if (has(`unit/${body}/4/idle`)) { const sp = sprite(`unit/${body}/4/idle`); sp.scale.set(3); sp.position.set(232, 232); layer.addChild(sp); }
    for (const slot of SLOT_IDS) { const geo = SLOTS[slot]; const [sx, sy] = SLOT_POS[slot]; const gw = slot === 'ground' ? 12 : geo.w, gh = slot === 'ground' ? 3 : geo.h; const g = new Graphics(); for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { if (slot !== 'ground' && !geo.cells.some(([cx, cy]) => cx === gx && cy === gy)) continue; g.rect(sx + gx * CELL, sy + gy * CELL, CELL, CELL).fill(P.shell1).stroke({ width: 1, color: P.shell3 }); } layer.addChild(g); const t = label(geo.label, { size: 'caption', color: P.textMuted }); t.position.set(sx, sy - 16); layer.addChild(t);
      const hit = new Container(); hit.eventMode = 'static'; (hit as any).kitType = 'row'; hit.hitArea = { contains: (px: number, py: number) => px >= sx && py >= sy && px < sx + gw * CELL && py < sy + gh * CELL } as any; hit.on('pointertap', (e) => { const l = layer.toLocal({ x: e.globalX, y: e.globalY }); this.tapSlot(slot, Math.floor((l.x - sx) / CELL), Math.floor((l.y - sy) / CELL)); }); layer.addChild(hit); }
    for (const it of items) { const d = ITEMS[it.def]; if (!d) continue; const [sx, sy] = SLOT_POS[it.slot]; const c = new Container(); c.position.set(sx + it.gx * CELL, sy + it.gy * CELL); const bg = new Graphics().rect(1, 1, d.size.w * CELL - 2, d.size.h * CELL - 2).fill({ color: this.lifted?.key === it.key ? P.accentDeep : P.shell2, alpha: 0.9 }).stroke({ width: 1, color: this.lifted?.key === it.key ? P.accent : P.border }); c.addChild(bg); if (has(d.sprite)) { const sp = sprite(d.sprite); sp.width = d.size.w * CELL - 8; sp.height = d.size.h * CELL - 8; sp.position.set(4, 4); c.addChild(sp); } if (it.rounds !== undefined && (d.ammo?.length || d.category === 'ammo' || it.slot === 'ground')) { const r = readout(String(it.rounds), { size: 'caption', weight: '600' }); r.position.set(4, d.size.h * CELL - 18); c.addChild(r); } c.eventMode = 'static'; (c as any).kitType = 'button'; (c as any).label = `item ${d.name}`; c.hitArea = { contains: (px: number, py: number) => px >= 0 && py >= 0 && px < Math.max(44, d.size.w * CELL) && py < Math.max(44, d.size.h * CELL) } as any; c.on('pointertap', (e) => { e.stopPropagation(); this.tapItem(it); }); layer.addChild(c); }
    const stats = new Panel(Math.max(240, w - x0 - 620 - app.safe.right - S.x2), 200, { title: 'Load' }); stats.position.set(620, 0); layer.addChild(stats);
    const weight = weightOf(items.filter((i) => i.slot !== 'ground').map((i) => ({ weight: ITEMS[i.def].weight, ammoWeight: i.ammo ? ITEMS[i.ammo]?.weight : 0 }))); const strength = unit?.stats.strength ?? so?.stats.strength ?? 0;
    const wt = readout(`WEIGHT ${weight} / STRENGTH ${strength}`, { size: 'control', weight: '600', color: weight > strength ? P.warn : P.text }); stats.content.addChild(wt); if (weight > strength) { const warn = label('Overloaded: time units reduced next turn', { size: 'caption', color: P.warn }); warn.position.set(0, 28); stats.content.addChild(warn); }
    if (unit) { const tu = readout(`TU ${unit.tu} / ${unit.stats.tu}`, { size: 'control' }); tu.position.set(0, 52); stats.content.addChild(tu); }
    const hint = label(this.lifted ? `Holding ${ITEMS[this.lifted.def].name}: tap a slot to place, tap it again to cancel` : 'Tap an item to pick it up, then tap where it goes. Long-press for load / unload.', { size: 'caption', color: P.textMuted, wrap: stats.w - S.x2 * 2 }); hint.position.set(0, 84); stats.content.addChild(hint);
    const gt = label('GROUND / CRAFT STORES', { size: 'caption', color: P.textMuted }); gt.position.set(0, SLOT_POS.ground[1] - 16); layer.addChild(gt);
  }
  private cycle(d: number) { const s = getState(); const so = s.soldiers.find((x) => x.id === this.soldierId); const list = s.soldiers.filter((x) => x.baseId === (so?.baseId ?? this.baseId)); const i = list.findIndex((x) => x.id === this.soldierId); const n = list[(i + d + list.length) % list.length]; if (n) { this.soldierId = n.id; this.lifted = null; this.resize(); } }
  private tapItem(it: Placed) { if (this.lifted && this.lifted.key === it.key) { this.lifted = null; this.resize(); return; } if (this.lifted) { this.tapSlot(it.slot, it.gx, it.gy); return; } this.lifted = it; this.resize(); }
  private tapSlot(slot: InvSlot, gx: number, gy: number) {
    const l = this.lifted; if (!l) return; const s = getState(); const d = ITEMS[l.def];
    if (this.battle && s.battle) { const u = B.unitByUid(s.battle, this.uid)!; const r = B.moveItem(s.battle, u, l.key, slot, slot === 'rightHand' || slot === 'leftHand' ? 0 : gx, slot === 'rightHand' || slot === 'leftHand' ? 0 : gy); if (!r.ok) { toast(r.reason ?? 'Cannot place', 'warn'); return; } this.lifted = null; this.resize(); return; }
    const so = s.soldiers.find((x) => x.id === this.soldierId)!; const pool = s.bases.find((b) => b.id === so.baseId)!.items;
    if (slot === 'ground') { if (l.key < 1000) { const e = so.equipment[l.key]; so.equipment.splice(l.key, 1); pool[e.def] = (pool[e.def] ?? 0) + 1; if (e.ammo) pool[e.ammo] = (pool[e.ammo] ?? 0) + 1; } this.lifted = null; this.resize(); return; }
    const occ = occupiedCells(so.equipment.filter((_, i) => i !== l.key).map((e) => ({ ...e, size: ITEMS[e.def].size })), slot);
    if (slot === 'rightHand' || slot === 'leftHand') { gx = 0; gy = 0; if (so.equipment.some((e, i) => e.slot === slot && i !== l.key)) { toast('HAND OCCUPIED', 'warn'); return; } } else if (!fits(d, slot, gx, gy, occ)) { toast('DOES NOT FIT', 'warn'); return; }
    if (l.key >= 1000) { if ((pool[l.def] ?? 0) <= 0) { toast('NOT IN STORES', 'warn'); return; } pool[l.def]--; let ammo: string | undefined, rounds: number | undefined; if (d.ammo?.length) { const a = d.ammo.find((x) => (pool[x] ?? 0) > 0); if (a) { pool[a]--; ammo = a; rounds = ITEMS[a].clipSize; } } so.equipment.push({ slot, def: l.def, gx, gy, ammo, rounds }); }
    else { const e = so.equipment[l.key]; e.slot = slot; e.gx = gx; e.gy = gy; }
    this.lifted = null; this.resize();
  }
}
