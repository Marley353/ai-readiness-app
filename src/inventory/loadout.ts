// Soldier equipment records → battle loadouts, with a default rifle kit when nothing is equipped.
import type { Soldier } from '../core/state';
import type { BattleSetup } from '../battle/types';
import { ITEMS } from '../data/items';
export function loadoutFor(s: Soldier): BattleSetup['loadouts'][number] {
  if (s.equipment.length) return s.equipment.map((e) => ({ slot: e.slot, def: e.def, ammo: e.ammo, gx: e.gx, gy: e.gy, ...(e.rounds !== undefined ? { rounds: e.rounds } : {}) }));
  return [];
}
export const defaultKit = (): Soldier['equipment'] => [{ slot: 'rightHand', def: 'rifle', ammo: 'rifle-clip', rounds: ITEMS['rifle-clip'].clipSize }, { slot: 'belt', def: 'rifle-clip', gx: 0, gy: 0 }, { slot: 'belt', def: 'grenade', gx: 1, gy: 0 }];
