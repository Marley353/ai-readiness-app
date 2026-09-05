// Shared data contracts. Every rules table under src/data/ conforms to these.
// Numbers are the 1994 original's unless a comment says otherwise.

export type Difficulty = 0 | 1 | 2 | 3 | 4; // Beginner, Experienced, Veteran, Genius, Superhuman
export const DIFFICULTY_NAMES = ['Beginner', 'Experienced', 'Veteran', 'Genius', 'Superhuman'] as const;

export type DamageType =
  | 'none' | 'ap' | 'incendiary' | 'he' | 'laser' | 'plasma' | 'stun' | 'melee' | 'acid' | 'smoke';

export type ItemCategory =
  | 'weapon' | 'ammo' | 'grenade' | 'armour' | 'equipment' | 'corpse' | 'live-alien'
  | 'artefact' | 'hwp' | 'craft-weapon' | 'craft-ammo' | 'elerium' | 'alloys' | 'other';

export type BattleType =
  | 'firearm' | 'ammo' | 'melee' | 'grenade' | 'proximity' | 'medikit' | 'scanner'
  | 'mindprobe' | 'psiamp' | 'flare' | 'corpse' | 'none';

export interface ShotMode {
  /** TU cost as % of the unit's max TU (rounded down), original semantics. */
  tu: number;
  /** Weapon accuracy %, multiplied by the unit's firing accuracy. */
  accuracy: number;
  /** Shots fired (3 for auto). */
  shots?: number;
}

export interface ArmourValues { front: number; left: number; right: number; rear: number; under: number; }

export interface ArmourDef {
  values: ArmourValues;
  /** Damage multiplier per type, 1 = normal, 0 = immune. */
  damageMod: Partial<Record<DamageType, number>>;
  flying?: boolean;
  /** Sprite family key for the unit wearing it (e.g. 'xcom-personal'). */
  unitSprite: string;
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  battleType: BattleType;
  /** Inventory grid footprint. */
  size: { w: number; h: number };
  weight: number;
  twoHanded?: boolean;
  /** Purchase price ($); undefined = cannot be bought. */
  costBuy?: number;
  /** Sale price ($); 0 = cannot be sold. */
  costSell: number;
  /** Time in hours to receive a purchase (original: 0 = 24h default). */
  transferHours?: number;
  /** Storage space used in General Stores (original item "size" units, 0.1 = tiny). */
  storeSize: number;
  /** Fire modes (weapons). */
  snap?: ShotMode; aimed?: ShotMode; auto?: ShotMode; melee?: ShotMode;
  /** Compatible ammo ids. Empty/undefined with `damage` set = self-powered (lasers, stun rod). */
  ammo?: string[];
  /** Damage of this item when it is ammo / self-powered weapon / grenade. */
  damage?: number;
  damageType?: DamageType;
  /** Rounds per clip (ammo) or built-in shots (0 = unlimited for lasers). */
  clipSize?: number;
  /** Explosion radius in tiles (HE/incendiary/smoke/stun bomb). */
  blastRadius?: number;
  /** Waypoint-guided (Blaster Launcher). */
  guided?: boolean;
  /** Arcing trajectory (grenades, Small Launcher). */
  arcing?: boolean;
  /** Priming / throwing TU% (grenades). Defaults 50 / 25. */
  primeTu?: number; throwTu?: number;
  armour?: ArmourDef;
  medikit?: { heal: number; stimulant: number; painkiller: number; healTu: number; stimTu: number; painTu: number; healAmount: number; stimAmount: number; painAmount: number };
  /** TU cost to use the scanner / mind probe / psi-amp (absolute TU for scanner, % for psi). */
  useTu?: number;
  /** Research topic that must be complete before the item can be used / bought / manufactured. */
  requiresResearch?: string;
  /** Recovery score awarded per item at debrief. */
  recoveryScore?: number;
  /** Shares the alien-core visual family (ASSET-REF 5.4). */
  alienArtefact?: boolean;
  /** Atlas key for the inventory icon. */
  sprite: string;
  /** HWP definition when category === 'hwp'. */
  hwp?: HwpDef;
  /** For corpses / live aliens: the race they belong to. */
  race?: string;
  /** Live alien: needs Alien Containment. */
  liveAlien?: boolean;
  /** Max range in tiles (0 = unlimited within map). */
  maxRange?: number;
  /** Auto-shot range beyond which accuracy is penalised (original "aim range"). */
  aimRange?: number;
  /** Fuel consumption per shot for Elerium-based craft weapons etc. — unused in battle. */
  ufopaedia?: string;
}

export interface HwpDef {
  stats: UnitStats;
  armour: ArmourValues;
  damageMod: Partial<Record<DamageType, number>>;
  weapon: string; // item id
  ammoItem?: string;
  ammoRounds: number;
  flying?: boolean;
  size: 2; // 2x2 tiles
  unitSprite: string;
}

export interface UnitStats {
  tu: number; stamina: number; health: number; bravery: number; reactions: number;
  firing: number; throwing: number; strength: number; psiStrength: number; psiSkill: number; melee: number;
}

export type AlienRank = 'soldier' | 'navigator' | 'medic' | 'engineer' | 'leader' | 'commander' | 'terrorist';
export const ALIEN_RANKS: AlienRank[] = ['soldier', 'navigator', 'medic', 'engineer', 'leader', 'commander', 'terrorist'];

export interface AlienRankDef {
  stats: UnitStats;
  armour: ArmourValues;
  /** Score for killing (original "value"). */
  value: number;
  /** Item ids the rank spawns with, chosen by month-band weapon set index. */
  weaponSets: string[][];
  /** Aggression 0-2, intelligence 0-10 as in the original's AI tables. */
  aggression: number;
  intelligence: number;
  /** Stand / kneel heights in voxels (24 per level). */
  standHeight: number;
  kneelHeight: number;
  /** Research topic that interrogation of this rank unlocks (as a live captive). */
  interrogation?: string;
  liveItem: string;
  corpseItem: string;
  unitSprite: string;
  /** Energy recovered per turn (aliens use a flat value). */
  energyRecovery?: number;
}

export interface AlienRaceDef {
  id: string;
  name: string;
  ranks: Partial<Record<AlienRank, AlienRankDef>>;
  /** Terror units this race deploys (two terrorist unit ids, e.g. cyberdisc). */
  terrorUnits: string[];
  damageMod: Partial<Record<DamageType, number>>;
  /** Psionic attack capability. */
  psionic?: boolean;
  /** 2x2 unit. */
  big?: boolean;
  flying?: boolean;
  /** Melee-only (Chryssalid, Reaper, Silacoid, Zombie). */
  meleeOnly?: boolean;
  /** Special behaviours. */
  special?: 'zombify' | 'fire-trail' | 'spit' | 'explode-on-death' | 'psi';
  ufopaedia?: string;
  /** First month (0-based from Jan 1999) this race may appear on Earth. */
  firstMonth: number;
  /** Relative weight of this race appearing on a mission, indexed by month band [0-2,3-5,6-8,9+]. */
  weightByBand: number[];
}

export type UfoSize = 'very-small' | 'small' | 'medium' | 'large' | 'very-large';

export interface UfoTypeDef {
  id: string;
  name: string;
  size: UfoSize;
  /** Radar cross-section modifier % applied to detection chance. */
  radarProfile: number;
  /** Damage capacity (hull). */
  damageMax: number;
  /** Max speed, knots. */
  speedMax: number;
  /** Weapon power / range in km / reload time seconds (0 = unarmed). */
  weaponPower: number; weaponRange: number; reload: number;
  /** Score for shooting it down / recovering. */
  score: number;
  /** Battlescape footprint (tiles) of the hull. */
  footprint: { w: number; h: number; levels: number };
  /** Crew by rank for a landed/crashed craft, by difficulty index. */
  crew: Record<AlienRank, [number, number, number, number, number]>;
  /** Alien Alloys / Elerium / components yielded when recovered intact-ish. */
  recovery: { id: string; qty: number }[];
  /** Sell value of the whole hull is not sold; kept for symmetry. */
  sprite: string;
  wreckSprite: string;
  interiorSet: string;
  ufopaedia?: string;
}

export interface CraftTypeDef {
  id: string;
  name: string;
  speedMax: number; // knots
  acceleration: number;
  fuelMax: number; // conventional: kg? original uses units; Elerium craft: elerium units
  fuelItem?: string; // 'elerium-115' for alien-powered craft
  damageMax: number;
  weapons: number; // hardpoints
  soldiers: number;
  hwps: number;
  costBuy?: number;
  rentMonthly?: number; // monthly maintenance for bought craft
  /** Refuel rate per 30 min (fuel units) and repair per 30 min (damage). */
  refuelRate: number; repairRate: number;
  /** Radar range in km when airborne (craft radar). */
  radarRange: number;
  sprite: string;
  requiresResearch?: string;
  transferHours?: number;
  ufopaedia?: string;
}

export interface CraftWeaponDef {
  id: string;
  name: string;
  damage: number;
  range: number; // km
  accuracy: number; // %
  reloadCautious: number; reloadStandard: number; reloadAggressive: number; // seconds
  ammoMax: number;
  ammoItem?: string; // clip item consumed on rearm (Stingray Missiles etc.)
  rearmRate: number; // rounds per hour
  storeItem: string; // item id of the launcher itself
  sprite: string;
}

export interface FacilityDef {
  id: string;
  name: string;
  size: 1 | 2;
  buildDays: number;
  cost: number;
  maintenance: number;
  /** Capacities. */
  personnel?: number; // living quarters
  stores?: number; // general stores space
  aliens?: number; // containment
  labs?: number; // scientists
  workshops?: number; // engineers
  hangars?: number; // craft
  psiLab?: number;
  radarRange?: number; // km
  radarChance?: number; // % per 30-min check (small 10, large 20; hyperwave 100)
  hyperwave?: boolean;
  defenceDamage?: number; defenceHit?: number; // base defences
  mindShield?: boolean;
  lift?: boolean;
  requiresResearch?: string;
  sprite: string;
  ufopaedia?: string;
}

export interface ResearchDef {
  id: string;
  name: string;
  /** Man-days (scientist-days). */
  cost: number;
  /** All of these must be researched. */
  requires?: string[];
  /** Any one of these topics complete OR items in stores satisfies availability. */
  requiresAny?: string[];
  /** Item that must be in stores at the base to start (consumed if `consumes`). */
  requiresItem?: string;
  consumes?: boolean;
  /** Live alien interrogation topics: which topics they may "give". */
  getOneFree?: string[];
  /** UFOpaedia article id unlocked (defaults to id). */
  unlocksArticle?: string;
  /** Category tag used for UI grouping. */
  category: 'weapons' | 'armour' | 'craft' | 'alien-tech' | 'alien-life' | 'alien-research' | 'facilities' | 'hwp' | 'equipment';
  /** Points awarded when completed. */
  points: number;
  /** Hidden until discovered via interrogation / free lookups. */
  hidden?: boolean;
  /** Cannot be started directly; only via getOneFree. */
  onlyFree?: boolean;
}

export interface ManufactureDef {
  id: string;
  name: string;
  /** Output item id (or craft id). */
  produces: string;
  producesCraft?: boolean;
  /** Engineer-hours per unit. */
  hours: number;
  /** $ per unit. */
  cost: number;
  /** Workshop space required while in progress. */
  space: number;
  /** Required items per unit. */
  requiredItems: { id: string; qty: number }[];
  requiresResearch: string;
  category: 'weapons' | 'ammo' | 'armour' | 'craft' | 'craft-weapons' | 'equipment' | 'hwp' | 'ufo-components';
}

export interface CountryDef {
  id: string;
  name: string;
  /** Initial monthly funding range ($k); original picks a random value in range at start. */
  fundingMin: number; fundingMax: number;
  region: string;
  /** Lon/lat bounding boxes forming the country's territory (degrees). */
  areas: [number, number, number, number][]; // [lonMin, lonMax, latMin, latMax]
  /** Label position on the globe. */
  labelLon: number; labelLat: number;
}

export interface RegionDef {
  id: string;
  name: string;
  /** Base construction cost in this region ($). */
  baseCost: number;
  areas: [number, number, number, number][];
  /** Alien mission weights per month band for this region. */
  missionWeights: Record<string, number[]>;
  /** Terror-capable cities. */
  cities: { name: string; lon: number; lat: number }[];
}

export interface TerrainSetDef {
  id: string;
  name: string;
  /** Shapes are referenced by atlas key; tint is a palette token name. */
  tiles: TerrainTileDef[];
  /** Which climate lat bands / land types map here. */
  ground: string;
}

export interface TerrainTileDef {
  id: string;
  /** Rendering: list of parts drawn bottom-up: shape atlas key + palette token tint. */
  parts: { shape: string; tint: string; dz?: number }[];
  /** Blocking. */
  floor?: boolean;
  wallNorth?: boolean; wallWest?: boolean;
  object?: boolean;
  /** Armour (destruction threshold) per part. */
  armour: number;
  /** TU cost to enter (floor). */
  tuCost: number;
  /** Height in voxels the object rises (LOS/LOF). */
  height: number;
  /** Blocks vision (walls, big objects). */
  blocksVision?: boolean;
  /** Door / UFO door. */
  door?: 'normal' | 'ufo';
  /** Flammability 0-255 and fuel turns. */
  flammability: number; fuel: number;
  /** What it becomes when destroyed (tile id) or undefined = empty floor. */
  destroyedTo?: string;
  /** Gravlift / lift tile. */
  lift?: boolean;
  /** Smoke/fire spawn on destruction (HE-sensitive). */
  explosive?: number;
}

export interface AlienMissionDef {
  id: 'research' | 'harvest' | 'abduction' | 'infiltration' | 'base' | 'terror' | 'retaliation' | 'supply';
  name: string;
  /** Wave sequence: ufo type, count, trajectory, spacing minutes. */
  waves: { ufo: string; count: number; trajectory: string; timerMinutes: number; landsAt?: 'city' | 'random' | 'base' }[];
  score: number; // per successful mission wave
  /** Alien race weights per month band. */
  raceWeights: number[][]; // indexed [band][raceIndex in RACE_ORDER]
}

export const RACE_ORDER = ['sectoid', 'floater', 'snakeman', 'muton', 'ethereal'] as const;

export interface SoldierNamePool { first: string[]; last: string[]; }

export interface ScoreDef {
  /** Monthly performance thresholds by difficulty: below these the council complains / withdraws. */
  monthlyMinimum: [number, number, number, number, number];
  ufoDetected: number; ufoShotDown: number; ufoLandingRecovered: number;
  alienBaseDestroyed: number; terrorSiteWon: number; terrorSiteLost: number;
  civilianKilledByXcom: number; civilianKilledByAlien: number; civilianSaved: number;
  soldierLost: number; soldierWounded: number; alienKilled: number; alienCaptured: number;
  missionAborted: number; ufoLandedIgnored: number; alienActivityDaily: number;
}
