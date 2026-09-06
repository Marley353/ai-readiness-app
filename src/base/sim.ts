// Base sim — facilities, construction, capacities, purchase/sell/transfer, personnel, craft loadout. Pure functions
// over GameState (no Pixi), original 1994 rules. Every mutating call returns a Result; refusals carry a terse
// upper-case reason that the UI shows verbatim (e.g. 'INSUFFICIENT FUNDS').
//
// Conventions shared with the other sims:
// - A soldier or craft in transit (purchase delivery or inter-base transfer) has `baseId === -1` and is referenced
//   by a `transfers[]` entry (`soldierId` / `craftId`) on the destination base. Arrival sets `baseId`.
// - Hired scientists / engineers travel as transfer entries whose `item` is XFER_SCIENTIST / XFER_ENGINEER.
// - `base.scientists` / `base.engineers` are the FREE pools; staff assigned to research / manufacture projects are
//   counted through `base.research[].scientists` / `base.manufacture[].engineers` (OpenXcom semantics).
// - `advanceBases(G, hours)` (transfers, craft repair/refuel/rearm) and `dailyBases(G)` (construction) are meant
//   to be called by the geoscape clock; they emit 'transfer-arrived' / 'facility-built' on the bus.
import { bus } from '../core/events';
import { Rng } from '../core/rng';
import type { GameState, Base, Facility, Craft, Soldier, SoldierStats } from '../core/state';
import type { FacilityDef, ItemDef, CraftTypeDef, CraftWeaponDef, RegionDef } from '../data/types';
import {
  facilityDef, allFacilities, itemDef, allItems, craftDef, allCraftTypes, craftWeaponDef, craftWeaponForItem, allRegions,
  liftDefId, hireCost, salary, itemHours, craftHours, PERSONNEL_HOURS, type PersonnelKind,
} from './rules';

export const GRID = 6;
export const MAX_BASES = 8;
export const XFER_SCIENTIST = 'scientist';
export const XFER_ENGINEER = 'engineer';
export const HWP_SPACE = 4; // an HWP occupies four soldier places aboard a craft

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; reason: string };
export const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });
export const okv = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
const OK: Result = { ok: true, value: undefined };

// ---------------------------------------------------------------- lookups
export const nextId = (G: GameState) => G.nextId++;
export const baseById = (G: GameState, id: number): Base | undefined => G.bases.find((b) => b.id === id);
export const craftById = (G: GameState, id: number): Craft | undefined => G.craft.find((c) => c.id === id);
export const soldierById = (G: GameState, id: number): Soldier | undefined => G.soldiers.find((s) => s.id === id);
/** Soldiers stationed at a base (excludes in-transit and dead). */
export const soldiersAt = (G: GameState, baseId: number): Soldier[] => G.soldiers.filter((s) => s.baseId === baseId && !s.dead);
/** Craft in this base's hangars (in-transit craft carry baseId -1). */
export const craftAt = (G: GameState, baseId: number): Craft[] => G.craft.filter((c) => c.baseId === baseId);
export const builtFacilities = (base: Base): Facility[] => base.facilities.filter((f) => f.daysLeft <= 0);
export const isLift = (f: Facility) => !!facilityDef(f.def)?.lift || f.def === liftDefId();
export const facilitySize = (f: Facility) => facilityDef(f.def)?.size ?? 1;
export const isPersonnelXfer = (item: string | undefined) => item === XFER_SCIENTIST || item === XFER_ENGINEER;

/** Total staff of a kind counted against quarters: free pool + assigned to projects + in transit. */
export function totalScientists(base: Base) { return base.scientists + base.research.reduce((a, r) => a + r.scientists, 0) + incomingQty(base, XFER_SCIENTIST); }
export function totalEngineers(base: Base) { return base.engineers + base.manufacture.reduce((a, m) => a + m.engineers, 0) + incomingQty(base, XFER_ENGINEER); }
export const incomingQty = (base: Base, item: string) => base.transfers.filter((t) => t.item === item).reduce((a, t) => a + t.qty, 0);
export const incomingSoldiers = (base: Base) => base.transfers.filter((t) => t.soldierId !== undefined).length;
export const incomingCraft = (base: Base) => base.transfers.filter((t) => t.craftId !== undefined).length;

// ---------------------------------------------------------------- grid geometry
export function cellsFor(x: number, y: number, size: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) out.push([x + dx, y + dy]);
  return out;
}
export const facilityCells = (f: Facility) => cellsFor(f.x, f.y, facilitySize(f));
/** Facility whose footprint covers a cell. */
export function facilityAt(base: Base, x: number, y: number): Facility | undefined {
  return base.facilities.find((f) => { const s = facilitySize(f); return x >= f.x && x < f.x + s && y >= f.y && y < f.y + s; });
}
const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < GRID && y < GRID;
/** True when any cell of the footprint shares an edge with a *completed* facility (original rule; queued adjacency is not allowed). */
export function adjacentToBuilt(base: Base, x: number, y: number, size: number, ignoreId?: number) {
  for (const [cx, cy] of cellsFor(x, y, size)) {
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as [number, number][]) {
      if (!inBounds(nx, ny)) continue;
      const f = facilityAt(base, nx, ny);
      if (f && f.daysLeft <= 0 && f.id !== ignoreId) return true;
    }
  }
  return false;
}
/** Facilities that would lose their connection to the lift if `removeId` were removed (4-neighbour flood fill). */
export function disconnectedWithout(base: Base, removeId: number): Facility[] {
  const rest = base.facilities.filter((f) => f.id !== removeId);
  const lift = rest.find(isLift);
  if (!lift) return rest;
  const byCell = new Map<string, Facility>();
  for (const f of rest) for (const [cx, cy] of facilityCells(f)) byCell.set(`${cx},${cy}`, f);
  const seen = new Set<number>([lift.id]); const stack = [lift];
  while (stack.length) {
    const f = stack.pop()!;
    for (const [cx, cy] of facilityCells(f)) for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as [number, number][]) {
      const n = byCell.get(`${nx},${ny}`); if (n && !seen.has(n.id)) { seen.add(n.id); stack.push(n); }
    }
  }
  return rest.filter((f) => !seen.has(f.id));
}

// ---------------------------------------------------------------- capacities and upkeep
export interface Capacity { used: number; max: number }
export interface BaseCapacities { quarters: Capacity; stores: Capacity; labs: Capacity; workshops: Capacity; hangars: Capacity; containment: Capacity; psi: Capacity }
export const storeSizeOf = (itemId: string) => itemDef(itemId)?.storeSize ?? 0;
/** General-stores space in use: stores + craft cargo + HWPs aboard + incoming item deliveries (original counts all). */
export function storesUsed(G: GameState, base: Base): number {
  let total = 0;
  for (const [id, q] of Object.entries(base.items)) total += q * storeSizeOf(id);
  for (const c of craftAt(G, base.id)) {
    for (const [id, q] of Object.entries(c.items)) total += q * storeSizeOf(id);
    for (const h of c.hwps) total += storeSizeOf(h);
  }
  for (const t of base.transfers) if (t.item && !isPersonnelXfer(t.item) && !itemDef(t.item)?.liveAlien) total += t.qty * storeSizeOf(t.item);
  return Math.round(total * 100) / 100;
}
export function capacities(G: GameState, base: Base): BaseCapacities {
  const built = builtFacilities(base).map((f) => facilityDef(f.def)).filter((d): d is FacilityDef => !!d);
  const sum = (k: keyof FacilityDef) => built.reduce((a, d) => a + ((d[k] as number | undefined) ?? 0), 0);
  const aliensUsed = Object.values(base.aliens).reduce((a, b) => a + b, 0) + base.transfers.filter((t) => t.item && itemDef(t.item)?.liveAlien).reduce((a, t) => a + t.qty, 0);
  return {
    quarters: { used: soldiersAt(G, base.id).length + incomingSoldiers(base) + totalScientists(base) + totalEngineers(base), max: sum('personnel') },
    stores: { used: storesUsed(G, base), max: sum('stores') },
    labs: { used: base.research.reduce((a, r) => a + r.scientists, 0), max: sum('labs') },
    workshops: { used: base.manufacture.reduce((a, m) => a + m.engineers, 0), max: sum('workshops') },
    hangars: { used: craftAt(G, base.id).length + incomingCraft(base), max: sum('hangars') },
    containment: { used: aliensUsed, max: sum('aliens') },
    psi: { used: soldiersAt(G, base.id).filter((s) => s.psiTraining).length, max: sum('psiLab') },
  };
}
export const storesOver = (G: GameState, base: Base) => { const c = capacities(G, base).stores; return c.used > c.max; };
export interface Maintenance { facilities: number; personnel: number; craft: number; total: number }
/** Monthly upkeep: completed facilities + salaries + craft rent (craft under construction/in transit excluded). */
export function maintenance(G: GameState, base: Base): Maintenance {
  const facilities = builtFacilities(base).reduce((a, f) => a + (facilityDef(f.def)?.maintenance ?? 0), 0);
  const personnel = soldiersAt(G, base.id).length * salary('soldier') + totalScientists(base) * salary('scientist') + totalEngineers(base) * salary('engineer');
  const craft = craftAt(G, base.id).reduce((a, c) => a + (craftDef(c.type)?.rentMonthly ?? 0), 0);
  return { facilities, personnel, craft, total: facilities + personnel + craft };
}
export const totalMaintenance = (G: GameState) => G.bases.reduce((a, b) => a + maintenance(G, b).total, 0);

// ---------------------------------------------------------------- construction
export function researchedFacility(G: GameState, def: FacilityDef) { return !def.requiresResearch || G.researched.includes(def.requiresResearch); }
/** Whether a facility type can be started at all at this base (research, lift rules, funds, any valid cell). */
export function canBuild(G: GameState, base: Base, defId: string): Result<FacilityDef> {
  const def = facilityDef(defId); if (!def) return fail('UNKNOWN FACILITY');
  if (!researchedFacility(G, def)) return fail('RESEARCH REQUIRED');
  const hasLift = base.facilities.some(isLift);
  if (!hasLift && !def.lift) return fail('ACCESS LIFT FIRST');
  if (hasLift && def.lift) return fail('ALREADY BUILT');
  if (G.funds < def.cost) return fail('INSUFFICIENT FUNDS');
  if (validCells(base, defId).length === 0) return fail('NO SPACE');
  return okv(def);
}
/** Placement-only rules for a cell (bounds, free, adjacency / lift-first). */
export function placementOk(base: Base, defId: string, x: number, y: number): Result<FacilityDef> {
  const def = facilityDef(defId); if (!def) return fail('UNKNOWN FACILITY');
  const cells = cellsFor(x, y, def.size);
  if (!cells.every(([cx, cy]) => inBounds(cx, cy))) return fail('OUT OF BOUNDS');
  if (cells.some(([cx, cy]) => facilityAt(base, cx, cy))) return fail('OCCUPIED');
  const hasLift = base.facilities.some(isLift);
  if (!hasLift) return def.lift ? okv(def) : fail('ACCESS LIFT FIRST');
  if (def.lift) return fail('ALREADY BUILT');
  if (!adjacentToBuilt(base, x, y, def.size)) return fail('NOT ADJACENT');
  return okv(def);
}
export function validCells(base: Base, defId: string): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (placementOk(base, defId, x, y).ok) out.push([x, y]);
  return out;
}
/** Full check for building `defId` at (x, y): research → lift rules → placement → funds. */
export function canPlace(G: GameState, base: Base, defId: string, x: number, y: number): Result<FacilityDef> {
  const def = facilityDef(defId); if (!def) return fail('UNKNOWN FACILITY');
  if (!researchedFacility(G, def)) return fail('RESEARCH REQUIRED');
  const p = placementOk(base, defId, x, y); if (!p.ok) return p;
  if (G.funds < def.cost) return fail('INSUFFICIENT FUNDS');
  return okv(def);
}
/** Start construction: cost is deducted immediately, `daysLeft` counts down from `buildDays`. */
export function build(G: GameState, baseId: number, defId: string, x: number, y: number): Result<Facility> {
  const base = baseById(G, baseId); if (!base) return fail('NO BASE');
  const r = canPlace(G, base, defId, x, y); if (!r.ok) return r;
  G.funds -= r.value.cost;
  const f: Facility = { id: nextId(G), def: defId, x, y, daysLeft: r.value.buildDays };
  base.facilities.push(f);
  bus.emit('state-changed', { reason: 'build', baseId });
  return okv(f);
}
/** A completed facility is in use when removing it would push a capacity below its current usage. */
export function inUseReason(G: GameState, base: Base, f: Facility): string | null {
  if (f.daysLeft > 0) return null;
  const def = facilityDef(f.def); if (!def) return null;
  const c = capacities(G, base);
  const check = (cap: Capacity, amount: number | undefined, name: string) => (amount && amount > 0 && cap.max - amount < cap.used ? name : null);
  return check(c.quarters, def.personnel, 'QUARTERS') ?? check(c.stores, def.stores, 'STORES') ?? check(c.labs, def.labs, 'LABS') ?? check(c.workshops, def.workshops, 'WORKSHOPS')
    ?? check(c.hangars, def.hangars, 'HANGARS') ?? check(c.containment, def.aliens, 'CONTAINMENT') ?? check(c.psi, def.psiLab, 'PSI LAB');
}
export function canDismantle(G: GameState, base: Base, f: Facility): Result {
  if (isLift(f)) return fail('ACCESS LIFT');
  const used = inUseReason(G, base, f); if (used) return fail(`IN USE: ${used}`);
  if (disconnectedWithout(base, f.id).length) return fail('WOULD DISCONNECT');
  return OK;
}
/** Remove a facility (no refund, as in the original). */
export function dismantle(G: GameState, baseId: number, facilityId: number): Result {
  const base = baseById(G, baseId); if (!base) return fail('NO BASE');
  const f = base.facilities.find((x) => x.id === facilityId); if (!f) return fail('NO FACILITY');
  const r = canDismantle(G, base, f); if (!r.ok) return r;
  base.facilities.splice(base.facilities.indexOf(f), 1);
  bus.emit('state-changed', { reason: 'dismantle', baseId });
  return OK;
}
/** Daily construction tick: counts days down and announces completion. */
export function dailyBases(G: GameState) {
  for (const base of G.bases) for (const f of base.facilities) {
    if (f.daysLeft > 0) { f.daysLeft--; if (f.daysLeft === 0) bus.emit('facility-built', { baseId: base.id, facilityId: f.id, def: f.def, name: facilityDef(f.def)?.name ?? f.def }); }
  }
}

// ---------------------------------------------------------------- soldiers and craft factories
const FIRST_M = ['Adam', 'Bruno', 'Carlos', 'Dmitri', 'Erik', 'Felix', 'Gerard', 'Hiro', 'Ivan', 'Jonas', 'Kwame', 'Lucas', 'Marco', 'Nils', 'Omar', 'Pavel', 'Rafael', 'Sven', 'Tomas', 'Viktor', 'Wei', 'Yusuf'];
const FIRST_F = ['Ana', 'Beth', 'Chloe', 'Dana', 'Elena', 'Freya', 'Greta', 'Hana', 'Ingrid', 'Julia', 'Keiko', 'Lena', 'Maria', 'Nadia', 'Olga', 'Priya', 'Rosa', 'Sofia', 'Tara', 'Vera', 'Yara', 'Zoe'];
const LAST = ['Andersen', 'Baker', 'Costa', 'Dubois', 'Eriksson', 'Fischer', 'Garcia', 'Hoffmann', 'Ito', 'Jansen', 'Kowalski', 'Lindqvist', 'Moreau', 'Nakamura', 'Okafor', 'Petrov', 'Quinn', 'Rossi', 'Schmidt', 'Tanaka', 'Ulrich', 'Varga', 'Weber', 'Zhang'];
/** Rookie stat ranges from the original tables. */
function rookieStats(r: Rng): SoldierStats {
  return { tu: r.int(50, 60), stamina: r.int(40, 70), health: r.int(25, 40), bravery: 10 * r.int(1, 6), reactions: r.int(30, 60), firing: r.int(40, 70), throwing: r.int(50, 80), strength: r.int(20, 40), psiStrength: r.int(0, 100), psiSkill: 0, melee: r.int(20, 40) };
}
export type SoldierFactory = (G: GameState, baseId: number) => Soldier;
export const defaultSoldierFactory: SoldierFactory = (G, baseId) => {
  const r = new Rng(G.rngState);
  const gender: 'm' | 'f' = r.percent(50) ? 'm' : 'f';
  const stats = rookieStats(r);
  const name = `${r.pick(gender === 'm' ? FIRST_M : FIRST_F)} ${r.pick(LAST)}`;
  G.rngState = r.state;
  return { id: nextId(G), name, rank: 'rookie', stats, initial: { ...stats }, missions: 0, kills: 0, baseId, craftId: null, armour: null, wounded: 0, equipment: [], gender, psiTraining: false, recruited: G.time };
};
let soldierFactory: SoldierFactory = defaultSoldierFactory;
/** The campaign builder may install its own recruit generator (names pool / stat tables) here. */
export const setSoldierFactory = (f: SoldierFactory) => { soldierFactory = f; };
export const recruitSoldier = (G: GameState, baseId: number) => soldierFactory(G, baseId);

/** New craft named "<Type>-<n>" with n = next free per-type suffix, sitting in the hangar (baseId -1 while in transit). */
export function makeCraft(G: GameState, typeId: string, baseId: number, at?: { lon: number; lat: number }): Craft {
  const def = craftDef(typeId);
  const used = new Set(G.craft.filter((c) => c.type === typeId).map((c) => parseInt(c.name.split('-').pop() ?? '0', 10) || 0));
  let n = 1; while (used.has(n)) n++;
  return {
    id: nextId(G), type: typeId, name: `${def?.name ?? typeId}-${n}`, baseId, status: 'ready', fuel: def?.fuelMax ?? 0, damage: 0,
    weapons: Array.from({ length: def?.weapons ?? 0 }, () => null), soldiers: [], hwps: [], items: {}, lon: at?.lon ?? 0, lat: at?.lat ?? 0, speed: 0, dest: null,
  };
}

// ---------------------------------------------------------------- purchase / hire
/** Items X-COM can order: a purchase price, research satisfied, never alien goods. */
export function buyableItems(G: GameState): ItemDef[] {
  return allItems().filter((d) => d.costBuy !== undefined && d.costBuy > 0 && !d.liveAlien && d.category !== 'corpse' && d.category !== 'live-alien' && (!d.requiresResearch || G.researched.includes(d.requiresResearch)));
}
export function buyableCraft(G: GameState): CraftTypeDef[] {
  return allCraftTypes().filter((d) => d.costBuy !== undefined && d.costBuy > 0 && (!d.requiresResearch || G.researched.includes(d.requiresResearch)));
}
export interface PurchaseOrder { items?: Record<string, number>; craft?: Record<string, number>; soldiers?: number; scientists?: number; engineers?: number }
const entries = (r?: Record<string, number>) => Object.entries(r ?? {}).filter(([, q]) => q > 0);
export function purchaseCost(order: PurchaseOrder): number {
  let c = 0;
  for (const [id, q] of entries(order.items)) c += (itemDef(id)?.costBuy ?? 0) * q;
  for (const [id, q] of entries(order.craft)) c += (craftDef(id)?.costBuy ?? 0) * q;
  c += (order.soldiers ?? 0) * hireCost('soldier') + (order.scientists ?? 0) * hireCost('scientist') + (order.engineers ?? 0) * hireCost('engineer');
  return c;
}
export function purchaseStoreSpace(order: PurchaseOrder): number {
  return entries(order.items).reduce((a, [id, q]) => a + q * storeSizeOf(id), 0);
}
/** Validate a whole order against funds, stores, quarters and hangars (original: the order is all-or-nothing). */
export function canPurchase(G: GameState, base: Base, order: PurchaseOrder): Result<{ cost: number }> {
  for (const [id] of entries(order.items)) { const d = itemDef(id); if (!d) return fail('UNKNOWN ITEM'); if (!buyableItems(G).some((b) => b.id === id)) return fail('NOT FOR SALE'); }
  for (const [id] of entries(order.craft)) { if (!buyableCraft(G).some((b) => b.id === id)) return fail('NOT FOR SALE'); }
  const cost = purchaseCost(order);
  if (cost > G.funds) return fail('INSUFFICIENT FUNDS');
  const c = capacities(G, base);
  if (c.stores.used + purchaseStoreSpace(order) > c.stores.max) return fail('STORES FULL');
  const people = (order.soldiers ?? 0) + (order.scientists ?? 0) + (order.engineers ?? 0);
  if (people > 0 && c.quarters.used + people > c.quarters.max) return fail('QUARTERS FULL');
  const craftN = entries(order.craft).reduce((a, [, q]) => a + q, 0);
  if (craftN > 0 && c.hangars.used + craftN > c.hangars.max) return fail('HANGARS FULL');
  return okv({ cost });
}
/** Place the order: funds deducted now, goods arrive by transfer (items 24 h unless the item says otherwise, personnel and craft 72 h). */
export function purchase(G: GameState, baseId: number, order: PurchaseOrder): Result<{ cost: number }> {
  const base = baseById(G, baseId); if (!base) return fail('NO BASE');
  const r = canPurchase(G, base, order); if (!r.ok) return r;
  G.funds -= r.value.cost;
  for (const [id, q] of entries(order.items)) base.transfers.push({ item: id, qty: q, hoursLeft: itemHours(itemDef(id)!), from: null });
  for (const [id, q] of entries(order.craft)) for (let i = 0; i < q; i++) { const c = makeCraft(G, id, -1, base); G.craft.push(c); base.transfers.push({ craftId: c.id, qty: 1, hoursLeft: craftHours(craftDef(id)!), from: null }); }
  for (let i = 0; i < (order.soldiers ?? 0); i++) { const s = recruitSoldier(G, -1); G.soldiers.push(s); base.transfers.push({ soldierId: s.id, qty: 1, hoursLeft: PERSONNEL_HOURS, from: null }); }
  if (order.scientists) base.transfers.push({ item: XFER_SCIENTIST, qty: order.scientists, hoursLeft: PERSONNEL_HOURS, from: null });
  if (order.engineers) base.transfers.push({ item: XFER_ENGINEER, qty: order.engineers, hoursLeft: PERSONNEL_HOURS, from: null });
  bus.emit('state-changed', { reason: 'purchase', baseId });
  return r;
}
export const buyItem = (G: GameState, baseId: number, itemId: string, qty: number) => purchase(G, baseId, { items: { [itemId]: qty } });
export const buyCraft = (G: GameState, baseId: number, typeId: string, qty = 1) => purchase(G, baseId, { craft: { [typeId]: qty } });
export const hire = (G: GameState, baseId: number, kind: PersonnelKind, n: number) => purchase(G, baseId, { [`${kind}s`]: n } as PurchaseOrder);

// ---------------------------------------------------------------- sell / sack
export const sellPrice = (itemId: string) => itemDef(itemId)?.costSell ?? 0;
export const canSellItem = (itemId: string) => sellPrice(itemId) > 0;
/** Sell from stores (or release a live alien from containment). Proceeds are credited immediately. */
export function sell(G: GameState, baseId: number, itemId: string, qty: number): Result<{ proceeds: number }> {
  const base = baseById(G, baseId); if (!base) return fail('NO BASE');
  const def = itemDef(itemId); if (!def) return fail('UNKNOWN ITEM');
  if (qty <= 0) return fail('NOTHING TO SELL');
  const pool = def.liveAlien ? base.aliens : base.items;
  if ((pool[itemId] ?? 0) < qty) return fail('NOT IN STORES');
  if (!def.liveAlien && !canSellItem(itemId)) return fail('CANNOT SELL');
  pool[itemId] -= qty; if (pool[itemId] <= 0) delete pool[itemId];
  const proceeds = sellPrice(itemId) * qty;
  G.funds += proceeds;
  bus.emit('state-changed', { reason: 'sell', baseId });
  return okv({ proceeds });
}
export function craftSellPrice(typeId: string): number {
  const d = craftDef(typeId) as (CraftTypeDef & { costSell?: number }) | undefined; if (!d) return 0;
  return d.costSell ?? (d.costBuy ? Math.round(d.costBuy / 2) : 0);
}
const roundsPerClip = (w: CraftWeaponDef) => (w.ammoItem ? Math.max(1, itemDef(w.ammoItem)?.clipSize ?? 1) : 1);
/** Strip weapons, ammo, cargo and HWPs back into stores and unassign the crew. */
function unloadCraft(G: GameState, base: Base, c: Craft) {
  for (const w of c.weapons) if (w) { const d = craftWeaponDef(w.def); if (d) { addItem(base, d.storeItem, 1); if (d.ammoItem) addItem(base, d.ammoItem, Math.floor(w.ammo / roundsPerClip(d))); } }
  for (const [id, q] of Object.entries(c.items)) addItem(base, id, q);
  for (const h of c.hwps) addItem(base, h, 1);
  for (const s of G.soldiers) if (s.craftId === c.id) s.craftId = null;
  c.weapons = c.weapons.map(() => null); c.items = {}; c.hwps = []; c.soldiers = [];
}
export function sellCraft(G: GameState, craftId: number): Result<{ proceeds: number }> {
  const c = craftById(G, craftId); if (!c) return fail('NO CRAFT');
  const base = baseById(G, c.baseId); if (!base) return fail('IN TRANSIT');
  if (c.status === 'out') return fail('CRAFT IS OUT');
  unloadCraft(G, base, c);
  G.craft.splice(G.craft.indexOf(c), 1);
  const proceeds = craftSellPrice(c.type); G.funds += proceeds;
  bus.emit('state-changed', { reason: 'sell-craft', baseId: base.id });
  return okv({ proceeds });
}
/** Dismiss free scientists / engineers (staff on projects must be released first). */
export function sack(G: GameState, baseId: number, kind: 'scientist' | 'engineer', n: number): Result {
  const base = baseById(G, baseId); if (!base) return fail('NO BASE');
  if (n <= 0) return OK;
  const key = kind === 'scientist' ? 'scientists' : 'engineers';
  if (base[key] < n) return fail('ASSIGNED TO PROJECTS');
  base[key] -= n;
  bus.emit('state-changed', { reason: 'sack', baseId });
  return OK;
}
export function sackSoldier(G: GameState, soldierId: number): Result {
  const s = soldierById(G, soldierId); if (!s) return fail('NO SOLDIER');
  const base = baseById(G, s.baseId); if (!base) return fail('IN TRANSIT');
  const c = s.craftId !== null ? craftById(G, s.craftId) : undefined;
  if (c && c.status === 'out') return fail('ON MISSION');
  if (c) c.soldiers = c.soldiers.filter((id) => id !== s.id);
  if (s.armour && itemDef(s.armour)) addItem(base, s.armour, 1);
  G.soldiers.splice(G.soldiers.indexOf(s), 1);
  bus.emit('state-changed', { reason: 'sack', baseId: base.id });
  return OK;
}
export function addItem(base: Base, id: string, qty: number) { if (qty <= 0) return; base.items[id] = (base.items[id] ?? 0) + qty; }
export function removeItem(base: Base, id: string, qty: number): boolean {
  if ((base.items[id] ?? 0) < qty) return false;
  base.items[id] -= qty; if (base.items[id] <= 0) delete base.items[id]; return true;
}

// ---------------------------------------------------------------- transfers
const RAD = Math.PI / 180, GLOBE_R = 51.2;
/** Straight-line distance between two points in the original's globe units (radius 51.2). */
export function globeDistance(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const p = (q: { lon: number; lat: number }) => [GLOBE_R * Math.cos(q.lat * RAD) * Math.cos(q.lon * RAD), GLOBE_R * Math.cos(q.lat * RAD) * Math.sin(q.lon * RAD), GLOBE_R * Math.sin(q.lat * RAD)];
  const [x1, y1, z1] = p(a), [x2, y2, z2] = p(b);
  return Math.hypot(x2 - x1, y2 - y1, z2 - z1);
}
/** Transfer time in hours: 6 h handling + distance / 10 (whole hours), 6–16 h across the globe. */
export const transferHours = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => Math.floor(6 + globeDistance(a, b) / 10);
const XFER_RATE = { item: 1, personnel: 5, craft: 25 } as const;
export const transferUnitCost = (a: { lon: number; lat: number }, b: { lon: number; lat: number }, kind: keyof typeof XFER_RATE) => Math.floor(globeDistance(a, b) * XFER_RATE[kind]);
export interface TransferOrder { items?: Record<string, number>; aliens?: Record<string, number>; soldiers?: number[]; craft?: number[]; scientists?: number; engineers?: number }
export function transferCost(from: Base, to: Base, order: TransferOrder): number {
  let c = 0;
  c += entries(order.items).reduce((a, [, q]) => a + q, 0) * transferUnitCost(from, to, 'item');
  c += entries(order.aliens).reduce((a, [, q]) => a + q, 0) * transferUnitCost(from, to, 'item');
  c += ((order.soldiers?.length ?? 0) + (order.scientists ?? 0) + (order.engineers ?? 0)) * transferUnitCost(from, to, 'personnel');
  c += (order.craft?.length ?? 0) * transferUnitCost(from, to, 'craft');
  return c;
}
/** Crew that travels with a transferred craft (the original moves the craft with its soldiers aboard). */
export const craftCrew = (G: GameState, c: Craft) => G.soldiers.filter((s) => s.craftId === c.id && s.baseId === c.baseId);
export function canTransfer(G: GameState, from: Base, to: Base, order: TransferOrder): Result<{ cost: number; hours: number }> {
  if (from.id === to.id) return fail('SAME BASE');
  for (const [id, q] of entries(order.items)) if ((from.items[id] ?? 0) < q) return fail('NOT IN STORES');
  for (const [id, q] of entries(order.aliens)) if ((from.aliens[id] ?? 0) < q) return fail('NOT IN CONTAINMENT');
  if ((order.scientists ?? 0) > from.scientists || (order.engineers ?? 0) > from.engineers) return fail('ASSIGNED TO PROJECTS');
  const crafts = (order.craft ?? []).map((id) => craftById(G, id));
  if (crafts.some((c) => !c || c.baseId !== from.id)) return fail('NO CRAFT');
  if (crafts.some((c) => c!.status === 'out')) return fail('CRAFT IS OUT');
  const soldierIds = new Set(order.soldiers ?? []);
  for (const c of crafts) for (const s of craftCrew(G, c!)) soldierIds.add(s.id);
  const soldiers = [...soldierIds].map((id) => soldierById(G, id));
  if (soldiers.some((s) => !s || s.baseId !== from.id)) return fail('NO SOLDIER');
  const cost = transferCost(from, to, { ...order, soldiers: [...soldierIds] });
  if (cost > G.funds) return fail('INSUFFICIENT FUNDS');
  const cap = capacities(G, to);
  const space = entries(order.items).reduce((a, [id, q]) => a + q * storeSizeOf(id), 0) + crafts.reduce((a, c) => a + Object.entries(c!.items).reduce((b, [id, q]) => b + q * storeSizeOf(id), 0) + c!.hwps.reduce((b, h) => b + storeSizeOf(h), 0), 0);
  if (space > 0 && cap.stores.used + space > cap.stores.max) return fail('STORES FULL');
  const people = soldiers.length + (order.scientists ?? 0) + (order.engineers ?? 0);
  if (people > 0 && cap.quarters.used + people > cap.quarters.max) return fail('QUARTERS FULL');
  if (crafts.length > 0 && cap.hangars.used + crafts.length > cap.hangars.max) return fail('HANGARS FULL');
  const aliens = entries(order.aliens).reduce((a, [, q]) => a + q, 0);
  if (aliens > 0 && cap.containment.used + aliens > cap.containment.max) return fail('CONTAINMENT FULL');
  return okv({ cost, hours: transferHours(from, to) });
}
/** Move goods between bases: they leave now and arrive after `transferHours`. Cost is charged up front. */
export function transfer(G: GameState, fromId: number, toId: number, order: TransferOrder): Result<{ cost: number; hours: number }> {
  const from = baseById(G, fromId), to = baseById(G, toId);
  if (!from || !to) return fail('NO BASE');
  const r = canTransfer(G, from, to, order); if (!r.ok) return r;
  const hours = r.value.hours;
  G.funds -= r.value.cost;
  for (const [id, q] of entries(order.items)) { removeItem(from, id, q); to.transfers.push({ item: id, qty: q, hoursLeft: hours, from: fromId }); }
  for (const [id, q] of entries(order.aliens)) { from.aliens[id] -= q; if (from.aliens[id] <= 0) delete from.aliens[id]; to.transfers.push({ item: id, qty: q, hoursLeft: hours, from: fromId }); }
  if (order.scientists) { from.scientists -= order.scientists; to.transfers.push({ item: XFER_SCIENTIST, qty: order.scientists, hoursLeft: hours, from: fromId }); }
  if (order.engineers) { from.engineers -= order.engineers; to.transfers.push({ item: XFER_ENGINEER, qty: order.engineers, hoursLeft: hours, from: fromId }); }
  const movedSoldiers = new Set(order.soldiers ?? []);
  for (const id of order.craft ?? []) {
    const c = craftById(G, id)!;
    for (const s of craftCrew(G, c)) movedSoldiers.add(s.id);
    c.baseId = -1; c.status = 'ready'; c.dest = null;
    to.transfers.push({ craftId: c.id, qty: 1, hoursLeft: hours, from: fromId });
  }
  for (const id of movedSoldiers) {
    const s = soldierById(G, id)!;
    const c = s.craftId !== null ? craftById(G, s.craftId) : undefined;
    if (c && !(order.craft ?? []).includes(c.id)) { c.soldiers = c.soldiers.filter((x) => x !== s.id); s.craftId = null; }
    s.baseId = -1;
    to.transfers.push({ soldierId: s.id, qty: 1, hoursLeft: hours, from: fromId });
  }
  bus.emit('state-changed', { reason: 'transfer', baseId: fromId });
  return r;
}
export interface Arrival { baseId: number; item?: string; soldierId?: number; craftId?: number; qty: number }
/** Count transfer clocks down and deliver what has arrived. */
export function processTransfers(G: GameState, hours: number): Arrival[] {
  const arrived: Arrival[] = [];
  for (const base of G.bases) {
    const keep: Base['transfers'] = [];
    for (const t of base.transfers) {
      t.hoursLeft -= hours;
      if (t.hoursLeft > 0) { keep.push(t); continue; }
      if (t.item === XFER_SCIENTIST) base.scientists += t.qty;
      else if (t.item === XFER_ENGINEER) base.engineers += t.qty;
      else if (t.item) { if (itemDef(t.item)?.liveAlien) base.aliens[t.item] = (base.aliens[t.item] ?? 0) + t.qty; else addItem(base, t.item, t.qty); }
      else if (t.soldierId !== undefined) { const s = soldierById(G, t.soldierId); if (s) { s.baseId = base.id; s.craftId = null; } }
      else if (t.craftId !== undefined) { const c = craftById(G, t.craftId); if (c) { c.baseId = base.id; c.lon = base.lon; c.lat = base.lat; c.status = 'ready'; c.dest = null; for (const id of c.soldiers) { const s = soldierById(G, id); if (s && s.baseId === -1) s.baseId = base.id; } } }
      const a: Arrival = { baseId: base.id, item: t.item, soldierId: t.soldierId, craftId: t.craftId, qty: t.qty };
      arrived.push(a); bus.emit('transfer-arrived', a);
    }
    base.transfers = keep;
  }
  return arrived;
}
export function transferLabel(G: GameState, t: Base['transfers'][number]): string {
  if (t.item === XFER_SCIENTIST) return `Scientists ×${t.qty}`;
  if (t.item === XFER_ENGINEER) return `Engineers ×${t.qty}`;
  if (t.item) return `${itemDef(t.item)?.name ?? t.item} ×${t.qty}`;
  if (t.soldierId !== undefined) return soldierById(G, t.soldierId)?.name ?? 'Soldier';
  if (t.craftId !== undefined) return craftById(G, t.craftId)?.name ?? 'Craft';
  return 'Transfer';
}

// ---------------------------------------------------------------- craft loadout
export const craftSpaceUsed = (c: Craft) => c.soldiers.length + c.hwps.length * HWP_SPACE;
export const craftSpaceMax = (c: Craft) => craftDef(c.type)?.soldiers ?? 0;
/** Mount a craft weapon (by weapon id or its launcher item id) from stores into `slot`; null unmounts. */
export function equipCraftWeapon(G: GameState, craftId: number, slot: number, weaponId: string | null): Result {
  const c = craftById(G, craftId); if (!c) return fail('NO CRAFT');
  const base = baseById(G, c.baseId); if (!base) return fail('IN TRANSIT');
  if (c.status === 'out') return fail('CRAFT IS OUT');
  if (slot < 0 || slot >= c.weapons.length) return fail('NO HARDPOINT');
  const old = c.weapons[slot];
  if (old) { const d = craftWeaponDef(old.def); if (d) { addItem(base, d.storeItem, 1); if (d.ammoItem) addItem(base, d.ammoItem, Math.floor(old.ammo / roundsPerClip(d))); } c.weapons[slot] = null; }
  if (weaponId) {
    const d = craftWeaponDef(weaponId) ?? craftWeaponForItem(weaponId); if (!d) return fail('UNKNOWN WEAPON');
    if (!removeItem(base, d.storeItem, 1)) return fail('NOT IN STORES');
    c.weapons[slot] = { def: d.id, ammo: d.ammoItem ? 0 : d.ammoMax };
  }
  checkupCraft(c);
  bus.emit('state-changed', { reason: 'equip', baseId: base.id });
  return OK;
}
/** Board / disembark a soldier. */
export function assignSoldier(G: GameState, soldierId: number, craftId: number | null): Result {
  const s = soldierById(G, soldierId); if (!s) return fail('NO SOLDIER');
  if (s.craftId !== null) { const prev = craftById(G, s.craftId); if (prev) { if (prev.status === 'out') return fail('ON MISSION'); prev.soldiers = prev.soldiers.filter((x) => x !== s.id); } s.craftId = null; }
  if (craftId !== null) {
    const c = craftById(G, craftId); if (!c) return fail('NO CRAFT');
    if (c.baseId !== s.baseId || s.baseId < 0) return fail('NOT AT BASE');
    if (c.status === 'out') return fail('CRAFT IS OUT');
    if (s.wounded > 0) return fail('WOUNDED');
    if (craftSpaceUsed(c) + 1 > craftSpaceMax(c)) return fail('CRAFT FULL');
    c.soldiers.push(s.id); s.craftId = c.id;
  }
  bus.emit('state-changed', { reason: 'assign', baseId: s.baseId });
  return OK;
}
/** Load (+1) or unload (-1) an HWP from stores; each takes four soldier places and one of the craft's HWP slots. */
export function assignHwp(G: GameState, craftId: number, hwpItemId: string, delta: 1 | -1): Result {
  const c = craftById(G, craftId); if (!c) return fail('NO CRAFT');
  const base = baseById(G, c.baseId); if (!base) return fail('IN TRANSIT');
  if (c.status === 'out') return fail('CRAFT IS OUT');
  const def = craftDef(c.type);
  if (delta > 0) {
    if (itemDef(hwpItemId)?.category !== 'hwp') return fail('NOT AN HWP');
    if (c.hwps.length + 1 > (def?.hwps ?? 0)) return fail('NO HWP SLOT');
    if (craftSpaceUsed(c) + HWP_SPACE > craftSpaceMax(c)) return fail('CRAFT FULL');
    if (!removeItem(base, hwpItemId, 1)) return fail('NOT IN STORES');
    c.hwps.push(hwpItemId);
  } else {
    const i = c.hwps.indexOf(hwpItemId); if (i < 0) return fail('NOT ABOARD');
    c.hwps.splice(i, 1); addItem(base, hwpItemId, 1);
  }
  bus.emit('state-changed', { reason: 'hwp', baseId: base.id });
  return OK;
}
const LOADABLE = new Set(['weapon', 'ammo', 'grenade', 'equipment', 'other', 'artefact']);
export const isLoadable = (d: ItemDef) => LOADABLE.has(d.category) && d.battleType !== 'none' && !d.liveAlien;
/** Move `qty` of an item stores → craft (qty < 0 moves it back). */
export function loadCraftItem(G: GameState, craftId: number, itemId: string, qty: number): Result {
  const c = craftById(G, craftId); if (!c) return fail('NO CRAFT');
  const base = baseById(G, c.baseId); if (!base) return fail('IN TRANSIT');
  if (c.status === 'out') return fail('CRAFT IS OUT');
  const d = itemDef(itemId); if (!d) return fail('UNKNOWN ITEM');
  if (qty > 0) { if (!isLoadable(d)) return fail('NOT EQUIPMENT'); if (!removeItem(base, itemId, qty)) return fail('NOT IN STORES'); c.items[itemId] = (c.items[itemId] ?? 0) + qty; }
  else if (qty < 0) { const n = -qty; if ((c.items[itemId] ?? 0) < n) return fail('NOT ABOARD'); c.items[itemId] -= n; if (c.items[itemId] <= 0) delete c.items[itemId]; addItem(base, itemId, n); }
  bus.emit('state-changed', { reason: 'load', baseId: base.id });
  return OK;
}
/** Status precedence when in the hangar: repairs → rearming → refuelling → ready. */
export function checkupCraft(c: Craft) {
  if (c.status === 'out') return;
  const def = craftDef(c.type);
  const rearming = c.weapons.some((w) => w && (craftWeaponDef(w.def)?.ammoMax ?? 0) > w.ammo);
  c.status = c.damage > 0 ? 'repairs' : rearming ? 'rearming' : c.fuel < (def?.fuelMax ?? 0) ? 'refuelling' : 'ready';
}
/** One hour of rearming: each weapon gains up to `rearmRate` rounds, consuming whole clips from stores. Returns ammo items that ran out. */
export function rearmCraft(G: GameState, base: Base, c: Craft): string[] {
  const missing: string[] = [];
  for (const w of c.weapons) {
    if (!w) continue; const d = craftWeaponDef(w.def); if (!d || w.ammo >= d.ammoMax) continue;
    if (!d.ammoItem) { w.ammo = d.ammoMax; continue; }
    const per = roundsPerClip(d), need = Math.min(d.rearmRate, d.ammoMax - w.ammo), clips = Math.ceil(need / per), have = base.items[d.ammoItem] ?? 0;
    if (have >= clips) { removeItem(base, d.ammoItem, clips); w.ammo = Math.min(d.ammoMax, w.ammo + need); }
    else { if (have > 0) { removeItem(base, d.ammoItem, have); w.ammo = Math.min(d.ammoMax, w.ammo + have * per); } if (w.ammo < d.ammoMax) missing.push(d.ammoItem); }
  }
  return missing;
}
/** Half-hour repair / refuel step (Elerium craft burn one unit of the fuel item per step). */
export function serviceCraft(base: Base, c: Craft, steps: number) {
  const def = craftDef(c.type); if (!def) return;
  for (let i = 0; i < steps; i++) {
    if (c.damage > 0) { c.damage = Math.max(0, c.damage - def.repairRate); continue; }
    if (c.fuel < def.fuelMax) {
      if (def.fuelItem) { if (!removeItem(base, def.fuelItem, 1)) break; }
      c.fuel = Math.min(def.fuelMax, c.fuel + def.refuelRate);
    }
  }
}
/** Hourly base housekeeping for the geoscape clock: transfers arrive, hangar craft are repaired / refuelled / rearmed. */
export function advanceBases(G: GameState, hours: number): Arrival[] {
  const arrivals = processTransfers(G, hours);
  for (const base of G.bases) for (const c of craftAt(G, base.id)) {
    if (c.status === 'out') continue;
    serviceCraft(base, c, hours * 2);
    for (let h = 0; h < hours; h++) { const missing = rearmCraft(G, base, c); if (missing.length) { bus.emit('toast', { text: `${c.name}: NOT ENOUGH ${itemDef(missing[0])?.name?.toUpperCase() ?? 'AMMO'} TO REARM`, kind: 'warn' }); break; } }
    checkupCraft(c);
  }
  return arrivals;
}

// ---------------------------------------------------------------- psi lab
export function setPsiTraining(G: GameState, soldierId: number, on: boolean): Result {
  const s = soldierById(G, soldierId); if (!s) return fail('NO SOLDIER');
  const base = baseById(G, s.baseId); if (!base) return fail('IN TRANSIT');
  if (on && !s.psiTraining) { const c = capacities(G, base).psi; if (c.used + 1 > c.max) return fail('PSI LAB FULL'); }
  s.psiTraining = on;
  bus.emit('state-changed', { reason: 'psi', baseId: base.id });
  return OK;
}

// ---------------------------------------------------------------- new base
const inArea = (lon: number, lat: number, [lo, hi, la0, la1]: [number, number, number, number]) => {
  const latOk = lat >= Math.min(la0, la1) && lat <= Math.max(la0, la1);
  const L = ((lon + 540) % 360) - 180, a = ((lo + 540) % 360) - 180, b = ((hi + 540) % 360) - 180;
  return latOk && (a <= b ? L >= a && L <= b : L >= a || L <= b);
};
export function regionAt(lon: number, lat: number): RegionDef | undefined {
  return allRegions().find((r) => r.areas.some((a) => inArea(lon, lat, a)));
}
export const baseCostAt = (lon: number, lat: number) => regionAt(lon, lat)?.baseCost;
/** Found an empty base (the Access Lift is then the first thing to build). Region price is paid now. */
export function newBase(G: GameState, lon: number, lat: number, name: string): Result<Base> {
  if (G.bases.length >= MAX_BASES) return fail('MAX BASES');
  const region = regionAt(lon, lat); if (!region) return fail('NO REGION');
  if (G.funds < region.baseCost) return fail('INSUFFICIENT FUNDS');
  const clean = name.trim().slice(0, 24) || `Base ${G.bases.length + 1}`;
  if (G.bases.some((b) => b.name.toLowerCase() === clean.toLowerCase())) return fail('NAME IN USE');
  G.funds -= region.baseCost;
  const base: Base = { id: nextId(G), name: clean, lon, lat, facilities: [], items: {}, scientists: 0, engineers: 0, research: [], manufacture: [], transfers: [], aliens: {}, region: region.id };
  G.bases.push(base);
  bus.emit('state-changed', { reason: 'new-base', baseId: base.id });
  return okv(base);
}
/** Facility defs the chooser lists, in the original's order. */
export const buildableDefs = () => allFacilities();
export const personnelKinds: PersonnelKind[] = ['soldier', 'scientist', 'engineer'];
export { hireCost, salary };
