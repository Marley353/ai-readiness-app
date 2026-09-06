// Soldier generation, experience growth, promotion and memorial — rules of the 1994 original.
import type { GameState, Soldier, SoldierRank, SoldierStats } from '../core/state';
import { SOLDIER_RANKS } from '../core/state';
import type { BattleUnit } from '../battle/types';
import { Rng } from '../core/rng';
import { SOLDIER_RECRUIT, STAT_CAPS, PROMOTION, STAT_GROWTH, FUNDING } from '../data/score';
import { NAMES_M, NAMES_F, NAMES_LAST } from '../data/names';

export const RANK_TITLES: Record<SoldierRank, string> = { rookie: 'Rookie', squaddie: 'Squaddie', sergeant: 'Sergeant', captain: 'Captain', colonel: 'Colonel', commander: 'Commander' };
export const RANK_SHORT: Record<SoldierRank, string> = { rookie: 'Rk', squaddie: 'Sq', sergeant: 'Sgt', captain: 'Cpt', colonel: 'Col', commander: 'Cdr' };

export function generateSoldier(rng: Rng, id: number, baseId: number, date: number): Soldier {
  const gender: 'm' | 'f' = rng.percent(50) ? 'm' : 'f';
  const first = rng.pick(gender === 'm' ? NAMES_M : NAMES_F), last = rng.pick(NAMES_LAST);
  const R = SOLDIER_RECRUIT;
  const stats: SoldierStats = {
    tu: rng.int(R.tu[0], R.tu[1]), stamina: rng.int(R.stamina[0], R.stamina[1]), health: rng.int(R.health[0], R.health[1]),
    bravery: rng.int(R.bravery[0] / 10, R.bravery[1] / 10) * 10, reactions: rng.int(R.reactions[0], R.reactions[1]), firing: rng.int(R.firing[0], R.firing[1]),
    throwing: rng.int(R.throwing[0], R.throwing[1]), strength: rng.int(R.strength[0], R.strength[1]), psiStrength: rng.int(R.psiStrength[0], R.psiStrength[1]),
    psiSkill: 0, melee: rng.int(R.melee[0], R.melee[1]),
  };
  return { id, name: `${first} ${last}`, rank: 'rookie', stats, initial: { ...stats }, missions: 0, kills: 0, baseId, craftId: null, armour: null, wounded: 0, equipment: [], gender, psiTraining: false, recruited: date };
}

const improve = (exp: number, rng: Rng): number => { for (const t of STAT_GROWTH.thresholds) if (exp >= t.min) return rng.int(t.roll[0], t.roll[1]); return 0; };
const cap = (k: keyof SoldierStats, v: number) => Math.min(STAT_CAPS[k], v);

/** Apply a mission's experience counters to the roster entry (original growth tables). */
export function applyMissionExperience(s: Soldier, u: BattleUnit, rng: Rng) {
  const e = u.exp; let any = false;
  const grow = (k: keyof SoldierStats, exp: number) => { const g = improve(exp, rng); if (g > 0) { s.stats[k] = cap(k, s.stats[k] + g); any = true; } };
  grow('firing', e.firing); grow('throwing', e.throwing); grow('melee', e.melee); grow('reactions', e.reactions); grow('psiSkill', e.psiSkill);
  if (e.bravery > 0 && rng.percent(e.bravery * 10)) { s.stats.bravery = cap('bravery', s.stats.bravery + STAT_GROWTH.braveryStep); any = true; }
  if (any || e.firing + e.throwing + e.melee + e.reactions + e.psiSkill + e.bravery > 0) {
    const P = STAT_GROWTH.primaryRoll;
    s.stats.tu = cap('tu', s.stats.tu + rng.int(P.tu[0], P.tu[1])); s.stats.stamina = cap('stamina', s.stats.stamina + rng.int(P.stamina[0], P.stamina[1]));
    s.stats.health = cap('health', s.stats.health + rng.int(P.health[0], P.health[1])); s.stats.strength = cap('strength', s.stats.strength + rng.int(P.strength[0], P.strength[1]));
  }
  s.missions++; s.kills += u.kills;
}

export const soldierScore = (s: Soldier) => s.missions * 2 + s.kills * 10 + s.stats.firing + s.stats.reactions + s.stats.bravery / 10 + s.stats.tu;

/** Recalculate ranks by squad size after each mission (one Commander at 30+, Colonels per 23, Captains per 11, Sergeants per 5). */
export function promote(state: GameState): { soldierId: number; rank: SoldierRank }[] {
  const alive = state.soldiers.filter((s) => !s.dead);
  const n = alive.length;
  const quota: Record<SoldierRank, number> = { commander: n >= PROMOTION.commanderMin ? 1 : 0, colonel: Math.floor(n / PROMOTION.colonelPer), captain: Math.floor(n / PROMOTION.captainPer), sergeant: Math.floor(n / PROMOTION.sergeantPer), squaddie: Infinity, rookie: Infinity };
  const sorted = [...alive].sort((a, b) => soldierScore(b) - soldierScore(a));
  const promotions: { soldierId: number; rank: SoldierRank }[] = [];
  let ci = 0;
  const assign = (rank: SoldierRank, count: number) => { for (let k = 0; k < count && ci < sorted.length; k++, ci++) { const s = sorted[ci]; if (s.missions < PROMOTION.squaddieAfterMissions) { continue; } if (SOLDIER_RANKS.indexOf(rank) > SOLDIER_RANKS.indexOf(s.rank)) { s.rank = rank; promotions.push({ soldierId: s.id, rank }); } } };
  assign('commander', quota.commander); assign('colonel', quota.colonel); assign('captain', quota.captain); assign('sergeant', quota.sergeant);
  for (const s of alive) if (s.rank === 'rookie' && s.missions >= PROMOTION.squaddieAfterMissions) { s.rank = 'squaddie'; promotions.push({ soldierId: s.id, rank: 'squaddie' }); }
  return promotions;
}

export function killedInAction(state: GameState, s: Soldier, mission: string, cause: string, date: number) {
  s.dead = { date, mission, cause }; s.craftId = null;
  state.memorial.push(s);
  state.soldiers = state.soldiers.filter((x) => x.id !== s.id);
  state.stats.soldiersLost++;
}
/** Recovery days after a mission: each point of health lost costs 1–4 days (original: (maxHealth − health) × rand). */
export const woundedDays = (s: Soldier, healthLost: number, rng: Rng) => (healthLost <= 0 ? 0 : Math.max(1, Math.round(healthLost * rng.int(1, 4) * 0.5)));
export const salary = (rank: SoldierRank) => FUNDING.salaries.soldier + (SOLDIER_RANKS.indexOf(rank) * 5000);
export const rankTitle = (r: SoldierRank) => RANK_TITLES[r];
