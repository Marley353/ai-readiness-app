// Mission flow helpers shared by scenes.
import { scenes } from '../app/SceneManager';
import { autosave } from '../core/save';
import { getState } from '../core/state';
import { craftById, baseById } from '../core/campaign';
import type { BattleSetup } from '../battle/types';
import { isNightAt, monthIndex } from '../core/clock';
import { UFOS } from '../data/ufos';
import { loadoutFor } from '../inventory/loadout';

export async function startMission(params: any) { await autosave('mission'); scenes.show('battle', params); }
/** Build a BattleSetup from a pending mission (site / base defence / Cydonia). */
export function setupFromPending(p: NonNullable<ReturnType<typeof getState>['pendingMission']>): BattleSetup | null {
  const s = getState(); const craft = p.craftId !== undefined ? craftById(s, p.craftId) : undefined; const site = p.siteId !== undefined ? s.sites.find((x) => x.id === p.siteId) : undefined;
  const base = p.baseId !== undefined ? baseById(s, p.baseId) : craft ? baseById(s, craft.baseId) : s.bases[0];
  const soldierIds = craft ? craft.soldiers.filter((id) => s.soldiers.some((x) => x.id === id && !x.wounded)) : s.soldiers.filter((x) => x.baseId === base?.id && !x.wounded).map((x) => x.id);
  const loadouts: BattleSetup['loadouts'] = {}; for (const id of soldierIds) { const sol = s.soldiers.find((x) => x.id === id); if (sol) loadouts[id] = loadoutFor(sol); }
  const equipment = craft ? { ...craft.items } : base ? Object.fromEntries(Object.entries(base.items).filter(([k]) => ['rifle', 'rifle-clip', 'pistol', 'pistol-clip', 'grenade'].includes(k))) : {};
  const seed = (s.seed ^ (s.time / 1000)) >>> 0;
  if (p.kind === 'base-defence' && base) return { missionType: 'base-defence', terrainSet: 'xcom-base', alienRace: (p as any).race ?? 'sectoid', difficulty: s.difficulty, night: false, month: monthIndex(s.time), seed, baseId: base.id, soldierIds, hwpItems: [], equipment, loadouts, alienCrew: { soldier: 6 + s.difficulty * 2, navigator: 2, engineer: 2, leader: 1, commander: 1, terrorist: 2 } };
  if (p.kind === 'cydonia-surface' || p.kind === 'cydonia-brain') return { missionType: p.kind as any, terrainSet: p.kind, alienRace: 'sectoid', difficulty: s.difficulty, night: false, month: monthIndex(s.time), seed, craftId: craft?.type ?? 'avenger', craftUid: craft?.id, baseId: base?.id, soldierIds, hwpItems: craft?.hwps ?? [], equipment, loadouts, alienCrew: { soldier: 8 + s.difficulty * 2, leader: 2, commander: 1, terrorist: 4 } };
  if (!site) return null;
  const type = site.kind === 'crash' ? 'crash' : site.kind === 'landed' ? 'landed' : site.kind === 'terror' ? 'terror' : 'alien-base';
  return { missionType: type, terrainSet: site.terrainSet, ufoType: site.ufoType, alienRace: site.race, difficulty: s.difficulty, night: isNightAt(s.time, site.lon), month: monthIndex(s.time), seed, craftId: craft?.type ?? 'skyranger', craftUid: craft?.id, baseId: base?.id, soldierIds, hwpItems: craft?.hwps ?? [], equipment, loadouts, siteId: site.id, ...(site.ufoType ? {} : {}) };
}
export const ufoName = (id?: string) => (id ? UFOS[id]?.name ?? id : 'UFO');
