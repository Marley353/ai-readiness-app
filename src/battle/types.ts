// Battlescape state contracts (LOCKED). Everything here is plain JSON-serialisable.
import type { DamageType, UnitStats, ArmourValues, AlienRank } from '../data/types';

export type Faction = 'xcom' | 'alien' | 'civilian';
export type Facing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0 = N, clockwise
export type UnitStatus = 'standing' | 'kneeling' | 'panicking' | 'berserk' | 'unconscious' | 'dead';
export type ShotKind = 'snap' | 'aimed' | 'auto' | 'melee' | 'throw' | 'launch';
export type ReserveMode = 'none' | 'snap' | 'aimed' | 'auto';

export interface Vec3 { x: number; y: number; z: number; }

export interface BattleItem {
  uid: number;
  def: string;               // ItemDef id
  ammo?: string;             // loaded clip ItemDef id (weapons)
  rounds: number;            // rounds left in loaded clip / this clip / built-in
  primed?: number;           // grenade turns remaining (-1 = not primed); explodes when it hits 0 at turn end
  owner?: number;            // unit uid holding it
  slot?: InvSlot;            // where on the owner
  gx?: number; gy?: number;  // grid position inside belt/backpack/ground
  tile?: Vec3;               // when on the ground
  fuse?: number;             // flare burning etc.
}

export type InvSlot = 'rightHand' | 'leftHand' | 'belt' | 'backpack' | 'rightShoulder' | 'leftShoulder' | 'rightLeg' | 'leftLeg' | 'ground';

export interface Wounds { head: number; torso: number; leftArm: number; rightArm: number; leftLeg: number; rightLeg: number; }

export interface BattleUnit {
  uid: number;
  name: string;
  faction: Faction;
  originalFaction: Faction;      // mind control restores this each turn
  race?: string;                 // alien race id
  rank?: AlienRank | string;     // alien rank or soldier rank id
  soldierId?: number;            // link to roster
  hwp?: string;                  // ItemDef id when a tank
  pos: Vec3;
  facing: Facing;
  size: 1 | 2;
  stats: UnitStats;              // max values (after armour/encumbrance not applied)
  tu: number; energy: number; health: number; morale: number; stun: number;
  status: UnitStatus;
  kneeling: boolean;
  flying: boolean;
  armour: ArmourValues;          // current armour values (reduced by damage taken)
  armourDef?: string;            // ItemDef id of worn armour
  damageMod: Partial<Record<DamageType, number>>;
  wounds: Wounds;
  fire: number;                  // turns on fire
  items: number[];               // item uids carried
  visibleTo: number[];           // uids that currently see this unit (populated by los.ts)
  visibleUnits: number[];        // units this unit sees
  spotted: boolean;              // ever spotted by X-COM this mission (aliens)
  turnsSinceSeen: number;
  kills: number;
  exp: { firing: number; throwing: number; melee: number; reactions: number; psiSkill: number; bravery: number };
  mindControlled?: boolean;
  psiAttackedThisTurn?: number;
  standHeight: number; kneelHeight: number;
  unitSprite: string;
  energyRecovery?: number;
  aiState?: any;                 // owned by ai.ts
  spawnedFrom?: number;          // zombie → chryssalid origin
  dontReselect?: boolean;
  fatalWoundsTotal?: number;
  reserve?: ReserveMode;
}

export interface Tile {
  floor: string | null;      // TerrainTileDef id of the floor part (null = no floor: fall through)
  wallN: string | null;      // north wall tile def id
  wallW: string | null;      // west wall tile def id
  object: string | null;     // object tile def id
  smoke: number;             // turns of smoke remaining (0-...)
  fire: number;              // turns of fire remaining
  light: number;             // 0-15 light level (night missions)
  seen: boolean;             // ever seen by X-COM (fog of war memory)
  visible: boolean;          // currently visible to X-COM
  doorOpen?: boolean;
  ufoDoorOpen?: boolean;
  explosive?: number;        // remaining HE stored in a power source etc.
}

export interface BattleMap {
  w: number; h: number; levels: number;
  terrainSet: string;
  tiles: Tile[];             // index = (z * h + y) * w + x
  night: boolean;
  ambientLight: number;      // 15 day, 4 night
  spawnXcom: Vec3[];         // craft exit / start tiles
  spawnAlien: Vec3[];
  spawnCivilian: Vec3[];
  craftFootprint?: { x: number; y: number; w: number; h: number };
  ufoFootprint?: { x: number; y: number; w: number; h: number };
  blocks: { x: number; y: number; w: number; h: number; kind: string }[]; // for debugging / critics
}

export type MissionType = 'crash' | 'landed' | 'terror' | 'alien-base' | 'base-defence' | 'cydonia-surface' | 'cydonia-brain' | 'tutorial';

export interface BattleSetup {
  missionType: MissionType;
  terrainSet: string;
  ufoType?: string;
  alienRace: string;
  difficulty: number;
  night: boolean;
  month: number;                 // months since Jan 1999
  seed: number;
  craftId?: string;              // X-COM transport craft type
  craftUid?: number;
  baseId?: number;               // for base defence / return base
  soldierIds: number[];
  hwpItems?: string[];
  /** Items loaded on the craft (id → count) placed on the ground at spawn if not equipped. */
  equipment: Record<string, number>;
  /** Predefined loadouts per soldier (item ids in slots) — inventory scene fills these. */
  loadouts: Record<number, { slot: InvSlot; def: string; ammo?: string; gx?: number; gy?: number }[]>;
  /** Number of aliens by rank override (base defence / terror). */
  alienCrew?: Partial<Record<AlienRank, number>>;
  /** Alien base assault stage size etc. */
  siteId?: number;
}

export interface Explosion { centre: Vec3; power: number; type: DamageType; radius: number; itemUid?: number; }

export interface BattleLogEntry { turn: number; side: Faction; text: string; kind: 'info' | 'hit' | 'kill' | 'panic' | 'psi' | 'system'; }

export interface BattleState {
  setup: BattleSetup;
  map: BattleMap;
  units: BattleUnit[];
  items: BattleItem[];
  turn: number;
  side: Faction;                 // whose turn
  nextUid: number;
  selectedUid: number | null;
  reserve: ReserveMode;
  log: BattleLogEntry[];
  ended: null | { winner: Faction | 'abort'; reason: string };
  rngState: number;
  /** Aliens killed / captured / X-COM lost etc. accumulated for debrief. */
  tally: { alienKilled: number; alienStunned: number; xcomDead: number; xcomStunned: number; civSaved: number; civKilledXcom: number; civKilledAlien: number; shotsFired: number; hits: number };
  stage?: number;                // Cydonia stages
  missionObjectiveDone?: boolean; // brain destroyed / base command destroyed
  waypoints?: Vec3[];            // Blaster Launcher planning
  psiUsed?: Record<number, number>;
}
