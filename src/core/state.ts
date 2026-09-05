// Campaign state (LOCKED contracts). Plain JSON only. Import via getState()/setState().
import type { Difficulty, AlienRank } from '../data/types';
import type { BattleState, InvSlot } from '../battle/types';

export type SoldierRank = 'rookie' | 'squaddie' | 'sergeant' | 'captain' | 'colonel' | 'commander';
export const SOLDIER_RANKS: SoldierRank[] = ['rookie', 'squaddie', 'sergeant', 'captain', 'colonel', 'commander'];

export interface SoldierStats { tu: number; stamina: number; health: number; bravery: number; reactions: number; firing: number; throwing: number; strength: number; psiStrength: number; psiSkill: number; melee: number; }

export interface Soldier {
  id: number;
  name: string;
  rank: SoldierRank;
  stats: SoldierStats;        // current
  initial: SoldierStats;      // at recruitment (caps growth)
  missions: number;
  kills: number;
  baseId: number;
  craftId: number | null;
  armour: string | null;      // ItemDef id
  wounded: number;            // days of recovery remaining
  equipment: { slot: InvSlot; def: string; ammo?: string; gx?: number; gy?: number; rounds?: number }[];
  gender: 'm' | 'f';
  psiTraining: boolean;
  dead?: { date: number; mission: string; cause: string };
  recruited: number;          // date ms
  inPsiLabMonths?: number;
}

export interface Craft {
  id: number;
  type: string;               // CraftTypeDef id
  name: string;               // e.g. "Interceptor-1"
  baseId: number;
  status: 'ready' | 'refuelling' | 'rearming' | 'repairs' | 'out';
  fuel: number; damage: number;
  weapons: ({ def: string; ammo: number } | null)[];
  soldiers: number[];         // soldier ids aboard
  hwps: string[];             // ItemDef ids aboard
  items: Record<string, number>; // equipment aboard
  lon: number; lat: number;   // position when out
  speed: number;
  dest: null | { kind: 'ufo' | 'site' | 'base' | 'point' | 'waypoint'; id?: number; lon: number; lat: number };
  patrol?: boolean;
  lowFuel?: boolean;
  returning?: boolean;
  interceptingUfo?: number | null;
}

export interface Facility {
  id: number;
  def: string;                // FacilityDef id
  x: number; y: number;       // grid 0-5
  daysLeft: number;           // 0 = built
}

export interface Base {
  id: number;
  name: string;
  lon: number; lat: number;
  facilities: Facility[];
  items: Record<string, number>;     // general stores (ItemDef id → qty)
  scientists: number; engineers: number;
  research: { topic: string; scientists: number; progress: number }[];   // progress in man-days done
  manufacture: { project: string; engineers: number; qty: number; done: number; hoursIntoUnit: number }[];
  transfers: { item?: string; soldierId?: number; craftId?: number; qty: number; hoursLeft: number; from: number | null }[];
  aliens: Record<string, number>;    // live aliens in containment (live item id → qty)
  defenceHits?: number;
  region: string;
  psiQueue?: number[];
  scanned?: boolean;                 // aliens have located this base (retaliation)
}

export interface Ufo {
  id: number;
  type: string;
  race: string;
  missionId: number;
  lon: number; lat: number;
  altitude: 'ground' | 'very-low' | 'low' | 'high' | 'very-high';
  speed: number; heading: number;
  dest: { lon: number; lat: number } | null;
  waypoint: number;                   // index in trajectory
  status: 'flying' | 'landed' | 'crashed' | 'destroyed';
  damage: number;
  detected: boolean;
  hyperDetected: boolean;
  landedUntil?: number;               // date ms
  crashedUntil?: number;              // site expiry
  escaping?: boolean;
  shotDownBy?: number;
  ufopaediaRevealed?: boolean;
  trajectory: { lon: number; lat: number; altitude: Ufo['altitude'] }[];
  secondsSinceReload?: number;
  interceptingCraft?: number[];
}

export interface AlienMission {
  id: number;
  type: string;               // AlienMissionDef id
  race: string;
  region: string;
  wave: number;
  ufosLaunched: number;
  nextUfoAt: number;          // date ms
  done: boolean;
  targetBaseId?: number;
  targetCity?: string;
  aliensSuccess: number;
}

export interface Site {
  id: number;
  kind: 'crash' | 'landed' | 'terror' | 'alien-base';
  lon: number; lat: number;
  race: string;
  ufoType?: string;
  ufoId?: number;
  expiresAt: number | null;  // ms
  detected: boolean;
  terrainSet: string;
  city?: string;
  region: string;
  createdAt: number;
  supplyCount?: number;
}

export interface CountryState {
  id: string;
  funding: number;            // $ per month
  satisfaction: number;       // -? .. accumulates activity delta
  pact: boolean;              // signed with aliens
  activityAlien: number;      // this month
  activityXcom: number;       // this month
}

export interface MonthlyReport {
  month: number; year: number;
  score: number; xcomScore: number; alienScore: number;
  fundingChanges: { country: string; before: number; after: number; pact?: boolean }[];
  totalFunding: number;
  rating: string;
  warning: boolean;
  gameOver: boolean;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  difficulty: Difficulty;
  time: number;               // ms since epoch UTC; campaign starts 1999-01-01T00:00:00Z
  paused: boolean;
  compression: 0 | 1 | 2 | 3 | 4 | 5; // 5s, 1m, 5m, 30m, 1h, 1d
  funds: number;
  bases: Base[];
  soldiers: Soldier[];
  craft: Craft[];
  ufos: Ufo[];
  missions: AlienMission[];
  sites: Site[];
  countries: CountryState[];
  regionActivity: Record<string, { alien: number; xcom: number }>;
  researched: string[];
  ufopaediaSeen: string[];
  reports: MonthlyReport[];
  monthScore: { xcom: number; alien: number };
  nextId: number;
  battle: BattleState | null;
  pendingMission: null | { siteId?: number; craftId?: number; baseId?: number; kind: string };
  memorial: Soldier[];
  stats: { ufosShotDown: number; ufosRecovered: number; missionsWon: number; missionsLost: number; aliensKilled: number; aliensCaptured: number; soldiersLost: number; terrorSitesWon: number };
  gameOver: null | { reason: 'bankrupt' | 'council' | 'defeat' | 'victory'; text: string };
  options: { sfx: number; music: number; uiScale: 1 | 1.25; reducedMotion: boolean; autoEndTurn: boolean };
  tutorialDone: boolean;
  cydoniaUnlocked: boolean;
  monthsElapsed: number;
  warningsIssued: number;     // council warnings
  lastMonthlyScore: number;
  psiResearched?: boolean;
  alienBaseCount?: number;
  lastAutosave?: number;
}

let G: GameState | null = null;
export const getState = (): GameState => { if (!G) throw new Error('No campaign loaded'); return G; };
export const hasState = () => G !== null;
export const setState = (s: GameState | null) => { G = s; };
export const CAMPAIGN_START = Date.UTC(1999, 0, 1, 0, 0, 0);
export const COMPRESSION_SECONDS = [5, 60, 300, 1800, 3600, 86400] as const;
