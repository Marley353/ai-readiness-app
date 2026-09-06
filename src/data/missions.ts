import type { AlienMissionDef } from './types';
// Wave tables follow the original mission scripts: scouts precede the main craft; timers in minutes between UFOs.
const W = (ufo: string, count: number, trajectory: string, timerMinutes: number, landsAt?: 'city' | 'random' | 'base') => ({ ufo, count, trajectory, timerMinutes, landsAt });
const early = [[40, 40, 20, 0, 0], [25, 35, 30, 10, 0], [20, 25, 25, 20, 10], [10, 20, 25, 25, 20]];
export const ALIEN_MISSIONS: Record<string, AlienMissionDef> = {
  research: { id: 'research', name: 'Alien Research', waves: [W('small-scout', 1, 'p0', 9000), W('medium-scout', 1, 'p1', 3000), W('large-scout', 1, 'p2', 3000, 'random')], score: 10, raceWeights: early },
  harvest: { id: 'harvest', name: 'Alien Harvest', waves: [W('small-scout', 1, 'p0', 6000), W('harvester', 2, 'p3', 4500, 'random')], score: 20, raceWeights: early },
  abduction: { id: 'abduction', name: 'Alien Abduction', waves: [W('medium-scout', 1, 'p1', 6000), W('abductor', 2, 'p3', 4500, 'random')], score: 30, raceWeights: early },
  infiltration: { id: 'infiltration', name: 'Alien Infiltration', waves: [W('medium-scout', 1, 'p1', 6000), W('large-scout', 1, 'p2', 6000), W('supply-ship', 1, 'p4', 6000, 'random'), W('battleship', 1, 'p5', 3000, 'random')], score: 50, raceWeights: early },
  base: { id: 'base', name: 'Alien Base', waves: [W('medium-scout', 1, 'p1', 6000), W('supply-ship', 2, 'p4', 6000, 'random'), W('battleship', 1, 'p6', 3000, 'random')], score: 50, raceWeights: early },
  terror: { id: 'terror', name: 'Alien Terror', waves: [W('medium-scout', 1, 'p1', 3000), W('terror-ship', 1, 'p7', 3000, 'city')], score: 100, raceWeights: early },
  retaliation: { id: 'retaliation', name: 'Alien Retaliation', waves: [W('small-scout', 1, 'p8', 3000), W('large-scout', 1, 'p8', 3000), W('battleship', 1, 'p9', 3000, 'base')], score: 50, raceWeights: early },
  supply: { id: 'supply', name: 'Alien Supply', waves: [W('supply-ship', 1, 'p4', 6000, 'base')], score: 20, raceWeights: early },
};
/** Missions started per month by difficulty, plus terror cadence. [close]: the original runs one research mission at
 *  game start, adds a mission each month with weights favouring research/harvest early, and a terror mission monthly
 *  from the second month; retaliation follows a base being scanned. */
export const MISSION_SCHEDULE = {
  perMonth: [1, 1, 2, 2, 3],
  weights: { research: [50, 40, 30, 20], harvest: [20, 20, 15, 10], abduction: [15, 15, 15, 10], infiltration: [5, 10, 15, 20], base: [10, 15, 25, 40] },
  terrorFromMonth: 1,
  terrorEveryMonth: true,
  retaliationChanceAfterScan: [10, 20, 30, 40, 50],
  bandOfMonth: (m: number) => (m < 3 ? 0 : m < 6 ? 1 : m < 9 ? 2 : 3),
};
export const RACE_BY_MONTH: Record<string, number[]> = { sectoid: [50, 40, 20, 10], floater: [50, 40, 20, 10], snakeman: [0, 20, 30, 30], muton: [0, 0, 20, 30], ethereal: [0, 0, 10, 20] };
