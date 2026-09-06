import type { ScoreDef } from './types';
export const SCORE: ScoreDef = {
  monthlyMinimum: [-1000, -900, -800, -700, -600],
  ufoDetected: 0, ufoShotDown: 0, ufoLandingRecovered: 0, alienBaseDestroyed: 500, terrorSiteWon: 200, terrorSiteLost: -500,
  civilianKilledByXcom: -60, civilianKilledByAlien: -30, civilianSaved: 30, soldierLost: -20, soldierWounded: 0, alienKilled: 0, alienCaptured: 0,
  missionAborted: -100, ufoLandedIgnored: -50, alienActivityDaily: 10,
};
export const FUNDING = {
  initialFunds: 6000000,
  salaries: { soldier: 20000, scientist: 30000, engineer: 25000 },
  hire: { soldier: 40000, scientist: 30000, engineer: 25000 },
  personnelDeliveryHours: 72,
  /** Council verdicts by monthly score. */
  ratings: [{ min: 1000, text: 'EXCELLENT' }, { min: 500, text: 'GOOD' }, { min: 200, text: 'OK' }, { min: 0, text: 'POOR' }, { min: -Infinity, text: 'TERRIBLE' }],
  /** Funding moves by 5–20 % of the current amount, towards the side winning the country's region. */
  fundingChangeMinPct: 5, fundingChangeMaxPct: 20,
  /** Two consecutive months at or below the difficulty threshold end the game. */
  consecutivePoorMonthsToLose: 2,
  alienActivityPerUfoHour: 1, alienActivityPerTerrorSite: 100, alienActivityPerPact: 200, alienActivityPerBaseMonth: 60,
  xcomActivityPerAlienKilled: 1, xcomActivityPerUfoDowned: 1,
} as const;
export const SOLDIER_RECRUIT = { tu: [50, 60], stamina: [40, 70], health: [25, 40], bravery: [10, 60], reactions: [30, 60], firing: [40, 70], throwing: [50, 80], strength: [20, 40], psiStrength: [0, 100], psiSkill: [0, 0], melee: [20, 40] } as const;
export const STAT_CAPS = { tu: 80, stamina: 100, health: 60, bravery: 100, reactions: 100, firing: 120, throwing: 120, strength: 70, psiStrength: 100, psiSkill: 100, melee: 120 } as const;
export const PROMOTION = { squaddieAfterMissions: 1, sergeantPer: 5, captainPer: 11, colonelPer: 23, commanderMin: 30 } as const;
/** Growth per stat from experience counters (OpenXcom improveStat, which reproduces the original). */
export const STAT_GROWTH = { thresholds: [{ min: 11, roll: [2, 6] }, { min: 6, roll: [1, 4] }, { min: 3, roll: [1, 3] }, { min: 1, roll: [0, 1] }], braveryStep: 10, primaryRoll: { tu: [0, 3], stamina: [0, 3], health: [0, 2], strength: [0, 1] } } as const;
export const STARTING_STAFF = { soldiers: 8, scientists: 10, engineers: 10, craft: ['skyranger', 'interceptor', 'interceptor'] } as const;
export const STARTING_INVENTORY: Record<string, number> = { rifle: 8, 'rifle-clip': 24, pistol: 4, 'pistol-clip': 12, 'heavy-cannon': 1, 'hc-ap-ammo': 4, 'hc-he-ammo': 4, 'auto-cannon': 1, 'ac-ap-ammo': 4, 'ac-he-ammo': 4, 'rocket-launcher': 1, 'small-rocket': 4, 'large-rocket': 2, grenade: 8, 'smoke-grenade': 4, 'electro-flare': 8, 'stun-rod': 1, 'stingray-missiles': 12, 'cannon-rounds': 4 };
export const STARTING_CRAFT_WEAPONS: Record<string, [string | null, string | null]> = { interceptor: ['stingray', 'cannon'], skyranger: [null, null] };
export const STARTING_FACILITIES: [string, number, number][] = [['access-lift', 2, 2], ['living-quarters', 3, 2], ['general-stores', 2, 3], ['laboratory', 3, 3], ['workshop', 4, 3], ['small-radar', 1, 2], ['hangar', 2, 0], ['hangar', 0, 3], ['hangar', 4, 4]];
