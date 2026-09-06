import type { BattleSetup } from '../battle/types';
import type { GameState } from '../core/state';
/** Skippable training exercise: a small farm crash site by day against a handful of Sectoids. */
export function tutorialSetup(state: GameState): BattleSetup {
  const soldierIds = state.soldiers.slice(0, 4).map((s) => s.id);
  return { missionType: 'tutorial', terrainSet: 'farm', ufoType: 'small-scout', alienRace: 'sectoid', difficulty: 0, night: false, month: 0, seed: 1994, craftId: 'skyranger', soldierIds, equipment: { rifle: 4, 'rifle-clip': 8, grenade: 2, 'medi-kit': 0 }, loadouts: {}, alienCrew: { soldier: 3 } };
}
