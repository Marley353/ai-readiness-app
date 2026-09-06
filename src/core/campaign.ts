// Campaign creation and shared lookups. Starting position per the 1994 original.
import { CAMPAIGN_START, type GameState, type Soldier, type Craft, type Base } from './state';
import type { Difficulty } from '../data/types';
import { Rng } from './rng';
import { COUNTRIES, regionAt } from '../data/countries';
import { FUNDING, STARTING_STAFF, STARTING_INVENTORY, STARTING_CRAFT_WEAPONS, STARTING_FACILITIES } from '../data/score';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { generateSoldier } from '../soldiers/roster';
import { setSoldierFactory } from '../base/sim';

export const nextId = (s: GameState) => s.nextId++;
export const baseById = (s: GameState, id: number) => s.bases.find((b) => b.id === id);
export const craftById = (s: GameState, id: number) => s.craft.find((c) => c.id === id);
export const soldierById = (s: GameState, id: number) => s.soldiers.find((x) => x.id === id);
/** RNG restored from the campaign state; call `save()` on the returned wrapper after use. */
export function campaignRng(s: GameState): Rng & { save(): void } { const r = new Rng(s.rngState) as Rng & { save(): void }; r.save = () => { s.rngState = r.state; }; return r; }

export function recruitSoldier(s: GameState, baseId: number): Soldier {
  const rng = campaignRng(s); const sol = generateSoldier(rng, nextId(s), baseId, s.time); rng.save(); s.soldiers.push(sol); return sol;
}
setSoldierFactory((s, baseId) => recruitSoldier(s, baseId));

export function addCraft(s: GameState, type: string, baseId: number): Craft {
  const def = CRAFT[type]; const base = baseById(s, baseId)!;
  const n = s.craft.filter((c) => c.type === type).length + 1;
  const weapons = (STARTING_CRAFT_WEAPONS[type] ?? []).slice(0, def.weapons).map((w) => (w ? { def: w, ammo: CRAFT_WEAPONS[w].ammoMax } : null));
  while (weapons.length < def.weapons) weapons.push(null);
  const c: Craft = { id: nextId(s), type, name: `${def.name}-${n}`, baseId, status: 'ready', fuel: def.fuelMax, damage: 0, weapons, soldiers: [], hwps: [], items: {}, lon: base.lon, lat: base.lat, speed: 0, dest: null };
  s.craft.push(c); return c;
}

export function newCampaign(difficulty: Difficulty, seed: number): GameState {
  const rng = new Rng(seed);
  const countries = Object.values(COUNTRIES).map((c) => ({ id: c.id, funding: Math.round(rng.int(c.fundingMin, c.fundingMax) / 1000) * 1000, satisfaction: 0, pact: false, activityAlien: 0, activityXcom: 0 }));
  const s: GameState = {
    version: 1, seed, rngState: rng.state, difficulty, time: CAMPAIGN_START, paused: true, compression: 0, funds: FUNDING.initialFunds,
    bases: [], soldiers: [], craft: [], ufos: [], missions: [], sites: [], countries, regionActivity: {}, researched: [], ufopaediaSeen: [], reports: [],
    monthScore: { xcom: 0, alien: 0 }, nextId: 1, battle: null, pendingMission: null, memorial: [],
    stats: { ufosShotDown: 0, ufosRecovered: 0, missionsWon: 0, missionsLost: 0, aliensKilled: 0, aliensCaptured: 0, soldiersLost: 0, terrorSitesWon: 0 },
    gameOver: null, options: { sfx: 8, music: 5, uiScale: 1, reducedMotion: false, autoEndTurn: false }, tutorialDone: false, cydoniaUnlocked: false,
    monthsElapsed: 0, warningsIssued: 0, lastMonthlyScore: 0,
  };
  return s;
}

/** Build the first base with the original's starting layout, staff, craft and stores. */
export function placeFirstBase(s: GameState, lon: number, lat: number, name: string): Base {
  const base: Base = { id: nextId(s), name, lon, lat, facilities: [], items: { ...STARTING_INVENTORY }, scientists: STARTING_STAFF.scientists, engineers: STARTING_STAFF.engineers, research: [], manufacture: [], transfers: [], aliens: {}, region: regionAt(lon, lat).id };
  for (const [def, x, y] of STARTING_FACILITIES) base.facilities.push({ id: nextId(s), def, x, y, daysLeft: 0 });
  s.bases.push(base);
  for (let i = 0; i < STARTING_STAFF.soldiers; i++) recruitSoldier(s, base.id);
  const craft = STARTING_STAFF.craft.map((t) => addCraft(s, t, base.id));
  const sky = craft.find((c) => c.type === 'skyranger');
  if (sky) for (const sol of s.soldiers.filter((x) => x.baseId === base.id)) { sol.craftId = sky.id; sky.soldiers.push(sol.id); }
  return base;
}
export function addBase(s: GameState, lon: number, lat: number, name: string): Base {
  const base: Base = { id: nextId(s), name, lon, lat, facilities: [], items: {}, scientists: 0, engineers: 0, research: [], manufacture: [], transfers: [], aliens: {}, region: regionAt(lon, lat).id };
  s.bases.push(base); return base;
}
