// Manufacturing: engineers, workshop space, hours per unit, cost and materials per unit. Rules of the original.
import type { GameState, Base } from '../core/state';
import { MANUFACTURE } from '../data/manufacture';
import { ITEMS } from '../data/items';
import { FACILITIES } from '../data/facilities';
import { CRAFT } from '../data/craft';
import { bus } from '../core/events';
export type Result = { ok: true } | { ok: false; reason: string };
const built = (b: Base) => b.facilities.filter((f) => f.daysLeft <= 0);
export const workshopCapacity = (b: Base) => built(b).reduce((a, f) => a + (FACILITIES[f.def]?.workshops ?? 0), 0);
export const allocatedEngineers = (b: Base) => b.manufacture.reduce((a, m) => a + m.engineers, 0);
export const freeEngineers = (b: Base) => Math.max(0, b.engineers - allocatedEngineers(b));
export const spaceUsed = (b: Base) => b.manufacture.reduce((a, m) => a + (MANUFACTURE[m.project]?.space ?? 0), 0) + allocatedEngineers(b);
export const freeWorkshopSpace = (b: Base) => Math.max(0, workshopCapacity(b) - spaceUsed(b));
export const hangarCapacity = (b: Base) => built(b).reduce((a, f) => a + (FACILITIES[f.def]?.hangars ?? 0), 0);
export const availableProjects = (state: GameState) => Object.values(MANUFACTURE).filter((m) => state.researched.includes(m.requiresResearch));
export const materialsText = (id: string) => (MANUFACTURE[id]?.requiredItems ?? []).map((r) => `${r.qty} ${ITEMS[r.id]?.name ?? r.id}`).join(', ');
export const unitProfit = (id: string) => { const m = MANUFACTURE[id]; if (!m) return 0; const sell = m.producesCraft ? 0 : ITEMS[m.produces]?.costSell ?? 0; const mats = m.requiredItems.reduce((a, r) => a + r.qty * (ITEMS[r.id]?.costSell ?? 0), 0); return sell - m.cost - mats; };
const hasMaterials = (b: Base, id: string) => (MANUFACTURE[id]?.requiredItems ?? []).every((r) => (b.items[r.id] ?? 0) >= r.qty);
export function startManufacture(state: GameState, baseId: number, project: string, engineers: number, qty: number): Result {
  const b = state.bases.find((x) => x.id === baseId); const def = MANUFACTURE[project];
  if (!b || !def) return { ok: false, reason: 'UNKNOWN PROJECT' };
  if (!state.researched.includes(def.requiresResearch)) return { ok: false, reason: 'RESEARCH REQUIRED' };
  if (b.manufacture.some((m) => m.project === project)) return { ok: false, reason: 'ALREADY IN PRODUCTION' };
  if (def.space + engineers > freeWorkshopSpace(b)) return { ok: false, reason: 'INSUFFICIENT WORKSHOP SPACE' };
  if (engineers > freeEngineers(b)) return { ok: false, reason: 'INSUFFICIENT ENGINEERS' };
  b.manufacture.push({ project, engineers, qty: Math.max(1, qty), done: 0, hoursIntoUnit: -1 });
  return { ok: true };
}
export function setEngineers(state: GameState, baseId: number, project: string, engineers: number): Result {
  const b = state.bases.find((x) => x.id === baseId); const m = b?.manufacture.find((x) => x.project === project); if (!b || !m) return { ok: false, reason: 'NO PROJECT' };
  const delta = engineers - m.engineers; if (delta > freeEngineers(b)) return { ok: false, reason: 'INSUFFICIENT ENGINEERS' }; if (delta > freeWorkshopSpace(b)) return { ok: false, reason: 'INSUFFICIENT WORKSHOP SPACE' };
  m.engineers = Math.max(0, engineers); return { ok: true };
}
export function cancelManufacture(state: GameState, baseId: number, project: string): Result {
  const b = state.bases.find((x) => x.id === baseId); if (!b) return { ok: false, reason: 'NO BASE' }; b.manufacture = b.manufacture.filter((m) => m.project !== project); return { ok: true };
}
export interface ManufactureDone { baseId: number; project: string; name: string; qty: number }
/** Advance every base's projects by `hours` engineer-hours per engineer. */
export function hourlyManufacture(state: GameState, hours = 1): ManufactureDone[] {
  const done: ManufactureDone[] = [];
  for (const b of state.bases) for (const m of [...b.manufacture]) {
    const def = MANUFACTURE[m.project]; if (!def || m.engineers <= 0) continue;
    let work = m.engineers * hours;
    while (work > 0 && m.done < m.qty) {
      if (m.hoursIntoUnit < 0) { // start a unit: pay and consume materials
        if (state.funds < def.cost) { (m as any).paused = 'INSUFFICIENT FUNDS'; break; }
        if (!hasMaterials(b, m.project)) { (m as any).paused = 'INSUFFICIENT MATERIALS'; break; }
        state.funds -= def.cost; for (const r of def.requiredItems) b.items[r.id] = (b.items[r.id] ?? 0) - r.qty; m.hoursIntoUnit = 0; (m as any).paused = undefined;
      }
      const need = def.hours - m.hoursIntoUnit; const use = Math.min(need, work); m.hoursIntoUnit += use; work -= use;
      if (m.hoursIntoUnit >= def.hours) {
        if (def.producesCraft) {
          const hangarsUsed = state.craft.filter((c) => c.baseId === b.id).length;
          if (hangarsUsed >= hangarCapacity(b)) { (m as any).paused = 'NO FREE HANGAR'; m.hoursIntoUnit = def.hours; break; }
          const type = CRAFT[def.produces]; const n = state.craft.filter((c) => c.type === def.produces).length + 1;
          state.craft.push({ id: state.nextId++, type: def.produces, name: `${type.name}-${n}`, baseId: b.id, status: 'ready', fuel: type.fuelMax, damage: 0, weapons: Array.from({ length: type.weapons }, () => null), soldiers: [], hwps: [], items: {}, lon: b.lon, lat: b.lat, speed: 0, dest: null });
        } else b.items[def.produces] = (b.items[def.produces] ?? 0) + 1;
        m.done++; m.hoursIntoUnit = -1;
      }
    }
    if (m.done >= m.qty) { b.manufacture = b.manufacture.filter((x) => x !== m); done.push({ baseId: b.id, project: m.project, name: def.name, qty: m.qty }); bus.emit('manufacture-done', { baseId: b.id, project: m.project, name: def.name }); }
  }
  return done;
}
export const manufactureTick = hourlyManufacture;
export const hoursLeft = (m: { project: string; engineers: number; qty: number; done: number; hoursIntoUnit: number }) => { const d = MANUFACTURE[m.project]; if (!d || m.engineers <= 0) return Infinity; return Math.ceil(((m.qty - m.done) * d.hours - Math.max(0, m.hoursIntoUnit)) / m.engineers); };
