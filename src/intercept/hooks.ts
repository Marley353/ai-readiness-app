import { hooks } from '../app/testHooks';
import { getState } from '../core/state';
import { startEngagement, setStance, step, engagementForCraft, lastInterceptResult, setResolveHandler, removeEngagement, type Stance } from './sim';
import { resolveInterception } from '../geoscape/sim';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { UFOS } from '../data/ufos';
let current: any = null;
export function installInterceptHooks() {
  setResolveHandler((st, r) => resolveInterception(st, { craftId: r.craftId, ufoId: r.ufoId, outcome: r.outcome, ufoDamage: r.ufoDamage, craftDamage: r.craftDamage }));
  hooks.add('intercept', {
    start: (craftId: number, ufoId: number) => { const s = getState(); const c = s.craft.find((x) => x.id === craftId)!; const u = s.ufos.find((x) => x.id === ufoId)!; current = engagementForCraft(craftId) ?? startEngagement(s, craftId, ufoId, { craft: CRAFT[c.type], weapons: c.weapons.map((w) => (w ? CRAFT_WEAPONS[w.def] : null)), ufo: UFOS[u.type] }); return !!current; },
    setStance: (st: Stance) => { if (current) setStance(current, st); },
    step: (seconds: number) => { if (!current) return null; const ev = step(getState(), current, seconds); if (current.resolved) { const r = current.result; removeEngagement(current.id); current = null; return r; } return ev.length; },
    result: () => (current ? current.result ?? (current.outcome ? { outcome: current.outcome } : null) : lastInterceptResult()),
  });
}
