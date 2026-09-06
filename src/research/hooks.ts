import { hooks } from '../app/testHooks';
import { getState } from '../core/state';
import { availableResearch, startResearch, completeResearch, researchProgress } from './sim';
import { startManufacture, hourlyManufacture } from '../manufacture/sim';
import { MANUFACTURE } from '../data/manufacture';
export function installResearchHooks() {
  hooks.add('research', { start: (baseId: number, topic: string, scientists: number) => startResearch(getState(), baseId, topic, scientists), available: (baseId: number) => availableResearch(getState(), baseId).map((r) => r.id), complete: (topic: string) => { const s = getState(); const b = s.bases[0]; if (s.researched.includes(topic)) return null; return completeResearch(s, b?.id ?? 0, topic); }, progress: (baseId: number) => researchProgress(getState(), baseId) });
  hooks.add('manufacture', { start: (baseId: number, project: string, engineers: number, qty: number) => startManufacture(getState(), baseId, project, engineers, qty), progress: (baseId: number) => getState().bases.find((b) => b.id === baseId)?.manufacture ?? [], finish: (baseId: number, project: string) => { const s = getState(); const b = s.bases.find((x) => x.id === baseId); const m = b?.manufacture.find((x) => x.project === project); if (!b || !m) return null; const def = MANUFACTURE[project]; const hours = Math.ceil(((m.qty - m.done) * def.hours + 1) / Math.max(1, m.engineers)); s.funds += def.cost * (m.qty - m.done); for (const r of def.requiredItems) b.items[r.id] = (b.items[r.id] ?? 0) + r.qty * (m.qty - m.done); return hourlyManufacture(s, hours + 1); } });
}
