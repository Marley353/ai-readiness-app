import { hooks } from '../app/testHooks';
import { getState, setState } from '../core/state';
import { computeDebrief, applyDebrief } from './score';
import { newCampaign } from '../core/campaign';
import { saveGame, loadGame } from '../core/save';
import { tutorialSetup } from '../scenes/tutorial';
import type { Difficulty } from '../data/types';
let last: any = null;
export function installDebriefHooks() {
  hooks.add('debrief', { compute: () => { const s = getState(); if (!s.battle) return null; last = computeDebrief(s, s.battle); return last; }, apply: () => { const s = getState(); if (!s.battle) return null; const d = last ?? computeDebrief(s, s.battle); last = null; return applyDebrief(s, d); }, report: () => getState().reports[getState().reports.length - 1] ?? null });
  hooks.add('menu', { newGame: (d: Difficulty) => { setState(newCampaign(d, 1)); return getState(); }, save: (slot: string) => saveGame(slot, `Test ${slot}`), load: (slot: string) => loadGame(slot), tutorialSetup: () => tutorialSetup(getState()) });
}
