// Paper-doll geometry, grid fit, weight and TU costs — the original's inventory rules as pure functions (no Pixi).
// Used by InventoryScene (this directory) and by the battlescape (moving items in the field).
//
// Geometry (1994 original): right/left hand hold one item of any footprint (up to 2×3); belt is a 4-wide top row
// plus the two end cells of a second row; backpack 3×3; each shoulder and each leg 2×1; the ground is a strip
// GROUND_ROWS high that scrolls sideways without limit.
import type { InvSlot } from '../battle/types';

export interface Cell { gx: number; gy: number }
export interface SlotGeom {
  id: InvSlot;
  /** Upper-case UI caption. */
  label: string;
  /** Hands take a single item of any size; grids are cell sets; ground is an open strip. */
  kind: 'hand' | 'grid' | 'ground';
  /** Cells offered by a grid slot (hands list their visual 2×3 area, ground lists the first column only). */
  cells: readonly (readonly [number, number])[];
  /** Bounding size in cells (ground: w = 0 → unbounded). */
  w: number; h: number;
}

export const HAND_W = 2, HAND_H = 3;
export const GROUND_ROWS = 3;
/** Largest item footprint the original ships (Heavy Cannon, Rocket Launcher…); nothing exceeds a hand. */
export const MAX_ITEM_W = 2, MAX_ITEM_H = 3;

const grid = (w: number, h: number): [number, number][] => { const out: [number, number][] = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push([x, y]); return out; };

export const SLOTS: Record<InvSlot, SlotGeom> = {
  rightHand: { id: 'rightHand', label: 'RIGHT HAND', kind: 'hand', cells: grid(HAND_W, HAND_H), w: HAND_W, h: HAND_H },
  leftHand: { id: 'leftHand', label: 'LEFT HAND', kind: 'hand', cells: grid(HAND_W, HAND_H), w: HAND_W, h: HAND_H },
  belt: { id: 'belt', label: 'BELT', kind: 'grid', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]], w: 4, h: 2 },
  backpack: { id: 'backpack', label: 'BACK PACK', kind: 'grid', cells: grid(3, 3), w: 3, h: 3 },
  rightShoulder: { id: 'rightShoulder', label: 'RIGHT SHOULDER', kind: 'grid', cells: grid(2, 1), w: 2, h: 1 },
  leftShoulder: { id: 'leftShoulder', label: 'LEFT SHOULDER', kind: 'grid', cells: grid(2, 1), w: 2, h: 1 },
  rightLeg: { id: 'rightLeg', label: 'RIGHT LEG', kind: 'grid', cells: grid(2, 1), w: 2, h: 1 },
  leftLeg: { id: 'leftLeg', label: 'LEFT LEG', kind: 'grid', cells: grid(2, 1), w: 2, h: 1 },
  ground: { id: 'ground', label: 'GROUND', kind: 'ground', cells: grid(1, GROUND_ROWS), w: 0, h: GROUND_ROWS },
};
export const SLOT_IDS: InvSlot[] = ['rightHand', 'leftHand', 'rightShoulder', 'leftShoulder', 'belt', 'backpack', 'rightLeg', 'leftLeg', 'ground'];
/** Slots on the body (everything but the ground). */
export const BODY_SLOTS: InvSlot[] = SLOT_IDS.filter((s) => s !== 'ground');
export const isHand = (s: InvSlot) => s === 'rightHand' || s === 'leftHand';
export const otherHand = (s: InvSlot): InvSlot => (s === 'rightHand' ? 'leftHand' : 'rightHand');

// ---------------------------------------------------------------------------------------------------------------
// Time units to move an item between slots (original table). Same slot → 0. Rows = from, columns = to.
type Costs = Partial<Record<InvSlot, number>>;
const hand: Costs = { ground: 2, rightHand: 4, leftHand: 4, rightLeg: 4, leftLeg: 4, belt: 4, backpack: 8, rightShoulder: 3, leftShoulder: 3 };
const leg: Costs = { ground: 6, rightHand: 4, leftHand: 4, rightLeg: 8, leftLeg: 8, belt: 8, backpack: 12, rightShoulder: 10, leftShoulder: 10 };
const belt: Costs = { ground: 6, rightHand: 4, leftHand: 4, rightLeg: 8, leftLeg: 8, backpack: 12, rightShoulder: 10, leftShoulder: 10 };
const backpack: Costs = { ground: 10, rightHand: 8, leftHand: 8, rightLeg: 12, leftLeg: 12, belt: 12, rightShoulder: 16, leftShoulder: 16 };
const shoulder: Costs = { ground: 4, rightHand: 3, leftHand: 3, rightLeg: 10, leftLeg: 10, belt: 10, backpack: 16, rightShoulder: 8, leftShoulder: 8 };
const ground: Costs = { rightHand: 8, leftHand: 8, rightLeg: 10, leftLeg: 10, belt: 10, backpack: 20, rightShoulder: 8, leftShoulder: 8 };
const rowOf = (from: InvSlot, c: Costs): Record<InvSlot, number> => {
  const r = {} as Record<InvSlot, number>;
  for (const to of SLOT_IDS) r[to] = to === from ? 0 : (c[to] ?? 0);
  return r;
};
export const TU_MOVE: Record<InvSlot, Record<InvSlot, number>> = {
  rightHand: rowOf('rightHand', hand), leftHand: rowOf('leftHand', hand),
  rightLeg: rowOf('rightLeg', leg), leftLeg: rowOf('leftLeg', leg),
  belt: rowOf('belt', belt), backpack: rowOf('backpack', backpack),
  rightShoulder: rowOf('rightShoulder', shoulder), leftShoulder: rowOf('leftShoulder', shoulder),
  ground: rowOf('ground', ground),
};
/** TU to move between two slots (0 within the same slot). */
export const tuMove = (from: InvSlot, to: InvSlot): number => (from === to ? 0 : TU_MOVE[from][to]);
/** Loading a clip into a hand-held weapon / unloading it into the other hand (battle only). */
export const TU_LOAD = 15, TU_UNLOAD = 8;

// ---------------------------------------------------------------------------------------------------------------
// Grid fitting.
export type Occupied = ReadonlySet<string>;
export const cellKey = (gx: number, gy: number) => `${gx},${gy}`;
export interface Sized { size: { w: number; h: number } }

/** Cells an item occupies when anchored (top-left) at gx,gy. */
export function footprint(item: Sized, gx: number, gy: number): Cell[] {
  const out: Cell[] = [];
  for (let y = 0; y < item.size.h; y++) for (let x = 0; x < item.size.w; x++) out.push({ gx: gx + x, gy: gy + y });
  return out;
}
const toSet = (occ?: Occupied | Iterable<Cell | readonly [number, number]>): Occupied => {
  if (!occ) return new Set();
  if (occ instanceof Set) return occ as Occupied;
  const s = new Set<string>();
  for (const c of occ as Iterable<any>) s.add(Array.isArray(c) ? cellKey(c[0], c[1]) : cellKey(c.gx, c.gy));
  return s;
};
/**
 * Whether `item` can be anchored at gx,gy in `slot` given the cells already taken there.
 * Hands: the whole hand is one place; gx/gy are ignored and any occupied cell means "hand holds something".
 * Ground: unbounded to the right, GROUND_ROWS high.
 */
export function fits(item: Sized, slot: InvSlot, gx: number, gy: number, occupied?: Occupied | Iterable<Cell | readonly [number, number]>): boolean {
  const g = SLOTS[slot]; if (!g) return false;
  const occ = toSet(occupied);
  if (g.kind === 'hand') return occ.size === 0 && item.size.w <= HAND_W && item.size.h <= HAND_H;
  if (gx < 0 || gy < 0) return false;
  if (g.kind === 'ground') { if (gy + item.size.h > GROUND_ROWS) return false; return footprint(item, gx, gy).every((c) => !occ.has(cellKey(c.gx, c.gy))); }
  const cells = new Set(g.cells.map(([x, y]) => cellKey(x, y)));
  return footprint(item, gx, gy).every((c) => { const k = cellKey(c.gx, c.gy); return cells.has(k) && !occ.has(k); });
}
/** First anchor (row-major) where the item fits, or null. Ground scans columns without limit. */
export function firstFit(item: Sized, slot: InvSlot, occupied?: Occupied | Iterable<Cell | readonly [number, number]>): Cell | null {
  const g = SLOTS[slot]; if (!g) return null;
  const occ = toSet(occupied);
  if (g.kind === 'hand') return fits(item, slot, 0, 0, occ) ? { gx: 0, gy: 0 } : null;
  if (g.kind === 'ground') { for (let gx = 0; gx < 4096; gx++) for (let gy = 0; gy + item.size.h <= GROUND_ROWS; gy++) if (fits(item, slot, gx, gy, occ)) return { gx, gy }; return null; }
  for (let gy = 0; gy < g.h; gy++) for (let gx = 0; gx < g.w; gx++) if (fits(item, slot, gx, gy, occ)) return { gx, gy };
  return null;
}
/** Anchors covering the tapped cell at which the item fits — nearest anchor to the tap first. */
export function anchorsCovering(item: Sized, slot: InvSlot, cx: number, cy: number, occupied?: Occupied | Iterable<Cell | readonly [number, number]>): Cell[] {
  const g = SLOTS[slot]; if (!g) return [];
  if (g.kind === 'hand') return fits(item, slot, 0, 0, occupied) ? [{ gx: 0, gy: 0 }] : [];
  const occ = toSet(occupied); const out: Cell[] = [];
  for (let dy = 0; dy < item.size.h; dy++) for (let dx = 0; dx < item.size.w; dx++) { const gx = cx - dx, gy = cy - dy; if (fits(item, slot, gx, gy, occ)) out.push({ gx, gy }); }
  return out.sort((a, b) => (Math.abs(a.gx - cx) + Math.abs(a.gy - cy)) - (Math.abs(b.gx - cx) + Math.abs(b.gy - cy)));
}
/** Occupied cell set of one slot from a list of placed items (hands count as fully occupied by any item). */
export function occupiedCells(placed: Iterable<{ slot: InvSlot; gx?: number; gy?: number } & Sized>, slot: InvSlot, exclude?: unknown): Set<string> {
  const s = new Set<string>();
  for (const p of placed) {
    if (p.slot !== slot || p === exclude) continue;
    if (SLOTS[slot].kind === 'hand') { for (const [x, y] of SLOTS[slot].cells) s.add(cellKey(x, y)); continue; }
    for (const c of footprint(p, p.gx ?? 0, p.gy ?? 0)) s.add(cellKey(c.gx, c.gy));
  }
  return s;
}
/** Which placed item (if any) covers a cell of a slot. */
export function itemAt<T extends { slot: InvSlot; gx?: number; gy?: number } & Sized>(placed: Iterable<T>, slot: InvSlot, cx: number, cy: number): T | null {
  for (const p of placed) {
    if (p.slot !== slot) continue;
    if (SLOTS[slot].kind === 'hand') return p;
    const gx = p.gx ?? 0, gy = p.gy ?? 0;
    if (cx >= gx && cx < gx + p.size.w && cy >= gy && cy < gy + p.size.h) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Weight and strength. The original never refuses an item for weight: a soldier carrying more than their strength
// simply starts each turn with TU × strength ÷ weight.
export interface Weighted { weight: number; /** loaded clip weight, counted with the weapon */ ammoWeight?: number }
export const weightOf = (items: Iterable<Weighted>): number => { let w = 0; for (const it of items) w += (it.weight || 0) + (it.ammoWeight || 0); return w; };
/** True when the load is within the soldier's strength (no encumbrance). Overloading is allowed but penalised. */
export const canHold = (strength: number, weight: number): boolean => weight <= strength;
export const isOverloaded = (strength: number, weight: number): boolean => weight > strength;
/** TU available at the start of a turn under the encumbrance rule. */
export const encumberedTu = (maxTu: number, strength: number, weight: number): number => (weight > strength && weight > 0 ? Math.floor((maxTu * strength) / weight) : maxTu);
export const encumbrance = (strength: number, weight: number) => ({ over: Math.max(0, weight - strength), overloaded: weight > strength, tuFactor: weight > strength && weight > 0 ? strength / weight : 1 });

// ---------------------------------------------------------------------------------------------------------------
// Ground strip packing (the original arranges dropped items automatically, left to right, three rows high).
export function arrangeGround<T extends Sized>(items: T[], rows = GROUND_ROWS): Map<T, Cell> {
  const occ = new Set<string>(); const out = new Map<T, Cell>();
  for (const it of items) {
    let placed = false;
    for (let gx = 0; gx < 4096 && !placed; gx++) for (let gy = 0; gy + it.size.h <= rows; gy++) {
      const cells = footprint(it, gx, gy);
      if (cells.every((c) => !occ.has(cellKey(c.gx, c.gy)))) { for (const c of cells) occ.add(cellKey(c.gx, c.gy)); out.set(it, { gx, gy }); placed = true; break; }
    }
  }
  return out;
}
/** Number of columns the arranged ground strip spans. */
export function groundWidth(arranged: Map<Sized, Cell>): number { let w = 0; for (const [it, c] of arranged) w = Math.max(w, c.gx + it.size.w); return w; }
