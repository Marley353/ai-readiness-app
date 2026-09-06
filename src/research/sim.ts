// Research simulation — pure rules, no rendering imports (runs under vitest/node and in the browser).
// Original mechanics: each base allocates scientists (≤ free scientists, ≤ laboratory capacity) to projects;
// every day a project gains one man-day per scientist and completes when man-days ≥ the topic's cost.
// Completion records the topic, unlocks its UFOpaedia article, consumes the required item when flagged,
// awards points, and interrogation topics grant one extra "free" topic from their list.
import type { GameState, Base, Facility } from '../core/state';
import type { ResearchDef, ItemDef, FacilityDef } from '../data/types';
import { RESEARCH } from '../data/research';
import { FACILITIES } from '../data/facilities';
import { ITEMS } from '../data/items';
import { bus } from '../core/events';
import { Rng } from '../core/rng';

// ---------------------------------------------------------------------------------------------------------------
// Table access. Rules tables may be exported as a record keyed by id, an array, or a Map — normalise once.
export type Table<T> = Record<string, T> | readonly T[] | ReadonlyMap<string, T>;
const cache = new WeakMap<object, Record<string, any>>();
export function byId<T extends { id: string }>(t: Table<T> | undefined | null): Record<string, T> {
  if (!t) return {};
  const hit = cache.get(t as object);
  if (hit) return hit as Record<string, T>;
  let out: Record<string, T>;
  if (t instanceof Map) out = Object.fromEntries(t.entries());
  else if (Array.isArray(t)) out = Object.fromEntries((t as readonly T[]).map((d) => [d.id, d]));
  else out = { ...(t as Record<string, T>) };
  cache.set(t as object, out);
  return out;
}
export const researchTable = () => byId<ResearchDef>(RESEARCH as any);
export const researchDef = (id: string): ResearchDef | undefined => researchTable()[id];
export const researchDefs = (): ResearchDef[] => Object.values(researchTable());
export const facilityDef = (id: string): FacilityDef | undefined => byId<FacilityDef>(FACILITIES as any)[id];
export const itemDef = (id: string): ItemDef | undefined => byId<ItemDef>(ITEMS as any)[id];
export const itemName = (id: string) => itemDef(id)?.name ?? id;

export type Result = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): Result => ({ ok: false, reason });
export const baseById = (state: GameState, baseId: number): Base | undefined => state.bases.find((b) => b.id === baseId);
export const isBuilt = (f: Facility) => f.daysLeft <= 0;

// ---------------------------------------------------------------------------------------------------------------
// Capacity.
/** Scientists the base's completed laboratories can hold. */
export function labCapacity(base: Base): number {
  let n = 0;
  for (const f of base.facilities) if (isBuilt(f)) n += facilityDef(f.def)?.labs ?? 0;
  return n;
}
export const allocatedScientists = (base: Base) => base.research.reduce((a, r) => a + r.scientists, 0);
export const freeScientists = (base: Base) => Math.max(0, base.scientists - allocatedScientists(base));
export const freeLabSpace = (base: Base) => Math.max(0, labCapacity(base) - allocatedScientists(base));
/** Upper bound for a project's scientist count given what it already holds. */
export const maxScientists = (base: Base, current = 0) => current + Math.min(freeScientists(base), freeLabSpace(base));

// ---------------------------------------------------------------------------------------------------------------
// Availability.
/** Units of an item at the base: general stores plus alien containment (live specimens). */
export const stockOf = (base: Base, id: string) => (base.items[id] ?? 0) + (base.aliens?.[id] ?? 0);
export const isResearched = (state: GameState, id: string) => state.researched.includes(id);
export const inProgressAnywhere = (state: GameState, id: string) => state.bases.some((b) => b.research.some((r) => r.topic === id));
export const projectAt = (base: Base, id: string) => base.research.find((r) => r.topic === id);

/** Every hard requirement of a topic, evaluated at one base. */
export function requirementsMet(state: GameState, base: Base, def: ResearchDef): boolean {
  if (def.requires?.some((r) => !isResearched(state, r))) return false;
  if (def.requiresAny?.length && !def.requiresAny.some((r) => isResearched(state, r) || stockOf(base, r) > 0)) return false;
  if (def.requiresItem && stockOf(base, def.requiresItem) <= 0) return false;
  return true;
}
/** Hidden topics only surface once a completed prerequisite or interrogation has named them. */
export function isDiscovered(state: GameState, def: ResearchDef): boolean {
  if (!def.hidden || isResearched(state, def.id)) return true;
  const named = [...(def.requires ?? []), ...(def.requiresAny ?? [])];
  if (named.some((r) => isResearched(state, r))) return true;
  return state.researched.some((r) => researchDef(r)?.getOneFree?.includes(def.id));
}
/** Topics the base may start right now (original list semantics: nothing locked is shown). */
export function availableResearch(state: GameState, baseId: number): ResearchDef[] {
  const base = baseById(state, baseId);
  if (!base) return [];
  return researchDefs().filter((d) => !isResearched(state, d.id) && !d.onlyFree && !inProgressAnywhere(state, d.id) && isDiscovered(state, d) && requirementsMet(state, base, d));
}
/** One-line requirement text for the NEW PROJECT list. */
export function requirementText(base: Base, def: ResearchDef): string {
  const parts: string[] = [];
  if (def.requiresItem) parts.push(`${def.consumes ? 'Consumes' : 'Requires'} ${itemName(def.requiresItem)} · ${stockOf(base, def.requiresItem)} in stores`);
  if (def.getOneFree?.length) parts.push('Interrogation: yields one further topic');
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------------------------------------------
// Projects.
export function startResearch(state: GameState, baseId: number, topic: string, scientists = 0): Result {
  const base = baseById(state, baseId);
  if (!base) return fail('No such base');
  const def = researchDef(topic);
  if (!def) return fail('Unknown topic');
  if (isResearched(state, topic)) return fail('Already researched');
  if (inProgressAnywhere(state, topic)) return fail('Already in progress');
  if (def.onlyFree || !isDiscovered(state, def) || !requirementsMet(state, base, def)) return fail('Requirements not met');
  const n = Math.max(0, Math.min(Math.floor(scientists), maxScientists(base)));
  base.research.push({ topic, scientists: n, progress: 0 });
  return { ok: true };
}
export function setResearchScientists(state: GameState, baseId: number, topic: string, scientists: number): Result {
  const base = baseById(state, baseId);
  const p = base && projectAt(base, topic);
  if (!base || !p) return fail('No such project');
  p.scientists = Math.max(0, Math.min(Math.floor(scientists), maxScientists(base, p.scientists)));
  return { ok: true };
}
/** Cancelling forfeits the man-days spent (original behaviour). */
export function cancelResearch(state: GameState, baseId: number, topic: string): Result {
  const base = baseById(state, baseId);
  if (!base) return fail('No such base');
  const i = base.research.findIndex((r) => r.topic === topic);
  if (i < 0) return fail('No such project');
  base.research.splice(i, 1);
  return { ok: true };
}
export const researchCost = (topic: string) => researchDef(topic)?.cost ?? 0;
/** Whole days until completion at the current allocation; Infinity when nobody is assigned. */
export function daysLeft(p: { topic: string; scientists: number; progress: number }): number {
  if (p.scientists <= 0) return Infinity;
  return Math.max(0, Math.ceil((researchCost(p.topic) - p.progress) / p.scientists));
}

export interface ResearchDone { topic: string; baseId: number; name: string; article: string; free: string | null; points: number; viaFree?: boolean }

function consumeOne(base: Base, id: string) {
  if ((base.items[id] ?? 0) > 0) { base.items[id] -= 1; if (base.items[id] <= 0) delete base.items[id]; return; }
  if (base.aliens && (base.aliens[id] ?? 0) > 0) { base.aliens[id] -= 1; if (base.aliens[id] <= 0) delete base.aliens[id]; }
}
/** Complete a topic at a base: bookkeeping, article, consumption, points, free topic, event. */
export function completeResearch(state: GameState, baseId: number, topic: string, opts: { viaFree?: boolean } = {}): ResearchDone {
  const def = researchDef(topic);
  const base = baseById(state, baseId);
  for (const b of state.bases) { const i = b.research.findIndex((r) => r.topic === topic); if (i >= 0) b.research.splice(i, 1); }
  if (!isResearched(state, topic)) state.researched.push(topic);
  const article = def?.unlocksArticle ?? topic;
  if (!state.ufopaediaSeen.includes(article)) state.ufopaediaSeen.push(article);
  if (base && def?.requiresItem && def.consumes && !opts.viaFree) consumeOne(base, def.requiresItem);
  const points = opts.viaFree ? 0 : (def?.points ?? 0);
  state.monthScore.xcom += points;
  if (/cydonia/.test(topic)) state.cydoniaUnlocked = true;
  if (/^psi(onic)?-lab/.test(topic)) state.psiResearched = true;
  let free: string | null = null;
  if (def?.getOneFree?.length) {
    const candidates = def.getOneFree.filter((id) => researchDef(id) && !isResearched(state, id));
    if (candidates.length) {
      const rng = new Rng(state.rngState);
      free = rng.pick(candidates);
      state.rngState = rng.state;
    }
  }
  const done: ResearchDone = { topic, baseId, name: def?.name ?? topic, article, free, points, viaFree: opts.viaFree };
  bus.emit('research-done', done);
  if (free) completeResearch(state, baseId, free, { viaFree: true });
  return done;
}

/** Daily tick: one man-day per assigned scientist. Returns the topics completed this day. */
export function dailyResearch(state: GameState): ResearchDone[] {
  const done: ResearchDone[] = [];
  for (const base of state.bases) {
    for (const p of [...base.research]) {
      if (!base.research.includes(p) || p.scientists <= 0) continue; // removed by a free grant earlier this tick
      const def = researchDef(p.topic);
      if (!def) { base.research.splice(base.research.indexOf(p), 1); continue; }
      p.progress += p.scientists;
      if (p.progress >= def.cost) done.push(completeResearch(state, base.id, p.topic));
    }
  }
  return done;
}
export const researchTick = dailyResearch;

/** Snapshot of a base's research for UIs and test hooks. */
export function researchProgress(state: GameState, baseId: number) {
  const base = baseById(state, baseId);
  if (!base) return null;
  return {
    baseId, scientists: base.scientists, free: freeScientists(base), labs: labCapacity(base), labFree: freeLabSpace(base),
    projects: base.research.map((p) => ({ topic: p.topic, name: researchDef(p.topic)?.name ?? p.topic, scientists: p.scientists, progress: p.progress, cost: researchCost(p.topic), daysLeft: daysLeft(p) })),
    available: availableResearch(state, baseId).map((d) => ({ topic: d.id, name: d.name, cost: d.cost, requirement: requirementText(base, d) })),
  };
}
