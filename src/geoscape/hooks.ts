import { hooks } from '../app/testHooks';
import { scenes } from '../app/SceneManager';
import { getState, setState } from '../core/state';
import { newCampaign, placeFirstBase } from '../core/campaign';
import { advanceTime, spawnUfo, spawnTerror, spawnRetaliation, sendCraft, returnToBase, resolveInterception, rollMonth, scheduleInitialMissions, launchCydonia } from './sim';
import type { Difficulty } from '../data/types';
export function installGeoHooks() {
  hooks.add('newCampaign', (d: Difficulty, seed: number) => { const s = newCampaign(d, seed); setState(s); return s; });
  hooks.add('placeFirstBase', (lon: number, lat: number, name: string) => { const b = placeFirstBase(getState(), lon, lat, name); scheduleInitialMissions(getState()); return b; });
  hooks.add('advance', (seconds: number) => { const s = getState(); s.paused = false; const ev = advanceTime(s, seconds); return ev; });
  hooks.add('spawnUfo', (type: string, race: string, lon: number, lat: number, status?: any) => spawnUfo(getState(), type, race, lon, lat, status));
  hooks.add('spawnTerror', (lon: number, lat: number, race?: string) => spawnTerror(getState(), lon, lat, race));
  hooks.add('spawnRetaliation', (baseId: number) => spawnRetaliation(getState(), baseId));
  hooks.add('sendCraft', (craftId: number, dest: any) => sendCraft(getState(), craftId, dest));
  hooks.add('returnToBase', (craftId: number) => returnToBase(getState(), craftId));
  hooks.add('resolveInterception', (r: any) => resolveInterception(getState(), r));
  hooks.add('forceMonthEnd', () => rollMonth(getState()));
  hooks.add('launchCydonia', (craftId: number) => { const r = launchCydonia(getState(), craftId); if (r.ok) scenes.show('battle', { pending: true }); return r; });
}
