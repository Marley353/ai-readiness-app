// Interception (dogfight) rules — pure simulation, no Pixi, no data-table imports. The scene and hooks feed it defs.
//
// Units follow the 1994 original's interception window: the window opens at 640, UFOpaedia ranges (km) are ×8 in
// window units (Stingray 30 km → 240), standoff is 560, the aggressive minimum is 64, and the craft closes at 2 units
// per second / opens at 4. A step is one second of game time; the geoscape sits at 5-second compression meanwhile.
// Hit chance = weapon accuracy × UFO-size modifier (very small ×0.8 … very large ×2.0, Volutar's disassembly of the
// original). A craft hit does 50–100 % of the weapon's damage; a UFO shot hits 60 % of the time for 0–100 % of its
// weapon power. A UFO crashes at ≥ 50 % hull damage (crash site) and is destroyed at 100 % (no site). After its
// break-off timer runs out a UFO that is faster than the craft outruns it and escapes once the distance passes 640.
import type { CraftTypeDef, CraftWeaponDef, UfoTypeDef, UfoSize } from '../data/types';
import type { GameState, Craft, Ufo } from '../core/state';
import { Rng, hashSeed } from '../core/rng';

export type Stance = 'standoff' | 'cautious' | 'standard' | 'aggressive' | 'disengage';
/** The four player stances (standoff is the pre-engagement hold the window opens in). */
export const STANCES: readonly Stance[] = ['cautious', 'standard', 'aggressive', 'disengage'];
export type Outcome = 'destroyed' | 'crashed' | 'escaped' | 'disengaged' | 'craft-destroyed';

export const DOGFIGHT = {
  startDistance: 640,      // window opens here
  standoffDistance: 560,   // initial hold; no UFO reaches this far
  minimumDistance: 64,     // aggressive attack closes to this
  disengageTarget: 800,    // disengage opens towards this …
  escapeDistance: 640,     // … and the window closes once the distance exceeds this (also the UFO's escape line)
  closeRate: 2,            // units per second while closing
  openRate: 4,             // units per second while opening / while a UFO outruns the craft
  rangeScale: 8,           // UFOpaedia km → window units
  ufoHitChance: 60,        // % per UFO shot
  craftDamageMinFraction: 0.5, // craft weapon hit rolls [damage × 0.5, damage]
  ufoDamageMinFraction: 0,     // UFO hit rolls [0, weaponPower]
  crashFraction: 0.5,      // hull damage ≥ max × this → crash site
  cautiousRetreatFraction: 0.5, // cautious attack falls back to standoff at this craft damage
  closeDelay: 30,          // seconds the resolved panel lingers before it closes
  maxEngagements: 2,       // concurrent panels
  logLength: 24,
} as const;

export const UFO_SIZE_INDEX: Record<UfoSize, number> = { 'very-small': 0, small: 1, medium: 2, large: 3, 'very-large': 4 };
/** Break-off timers (seconds, ±random) of the original's UFO types; by-size fallback for unknown ids. */
export const BREAK_OFF_BY_ID: Record<string, number> = {
  'small-scout': 200, 'medium-scout': 250, 'large-scout': 300, harvester: 500, abductor: 500,
  'terror-ship': 2000, battleship: 4000, 'supply-ship': 3000,
};
export const BREAK_OFF_BY_SIZE: Record<UfoSize, number> = { 'very-small': 200, small: 300, medium: 500, large: 2000, 'very-large': 4000 };

export interface WeaponState { slot: number; def: CraftWeaponDef; countdown: number; shots: number; hits: number }
export type LogKind = 'info' | 'ufo-hit' | 'craft-hit' | 'miss' | 'warn' | 'end';
export interface LogEntry { t: number; text: string; kind: LogKind }
export type SimEvent =
  | { kind: 'shot'; from: 'craft' | 'ufo'; slot?: number; weapon?: string; beam: boolean; hit: boolean; damage: number }
  | { kind: 'explosion'; target: 'craft' | 'ufo'; size: 'small' | 'large' }
  | { kind: 'status'; text: string }
  | { kind: 'end'; outcome: Outcome };

/** Per-UFO record shared by every engagement against the same UFO (one gun, one break-off timer, one hull). */
export interface UfoCombat {
  ufoId: number;
  fireCountdown: number;
  shootingAt: number | null;      // engagement id under fire
  escapeCountdown: number;        // seconds until the UFO goes to full speed
  outrunning: boolean;            // faster than the craft and opening distance
  down: Outcome | null;           // 'crashed' | 'destroyed' once shot down
  killer: number | null;          // engagement id that landed the decisive hit
  tick: number;                   // last global tick applied (shared timers advance once per tick)
}

export interface InterceptDefs { craft: CraftTypeDef; weapons: (CraftWeaponDef | null)[]; ufo: UfoTypeDef }

export interface InterceptResult {
  craftId: number; ufoId: number; outcome: Outcome;
  /** Absolute hull damage after the engagement (what `craft.damage` / `ufo.damage` read). */
  ufoDamage: number; craftDamage: number;
  seconds: number; shots: number; hits: number;
}
export type ResolveHandler = (state: GameState, result: InterceptResult) => void;

export interface Engagement {
  id: number; craftId: number; ufoId: number;
  craft: CraftTypeDef; ufo: UfoTypeDef; craftName: string;
  weapons: (WeaponState | null)[];
  stance: Stance; distance: number; targetDistance: number; seconds: number;
  status: string; log: LogEntry[]; events: SimEvent[];
  shared: UfoCombat;
  outcome: Outcome | null; closing: number; resolved: boolean; result: InterceptResult | null;
  rng: Rng;
}

// ---------------------------------------------------------------------------------------------------------------
// Rules helpers (exported for the UI and the tests).
export const rangeUnits = (km: number) => Math.round(km * DOGFIGHT.rangeScale);
export const ufoRangeUnits = (ufo: UfoTypeDef) => (ufo.weaponPower > 0 ? rangeUnits(ufo.weaponRange) : 0);
/** UFO-size modifier on craft weapon accuracy. */
export const sizeHitModifier = (size: UfoSize) => (100 + Math.floor(300 / (5 - UFO_SIZE_INDEX[size]))) / 100 / 2;
/** Hit chance in whole percent: accuracy × size modifier, rounded to nearest as the original's integer maths does. */
export function hitChance(accuracy: number, size: UfoSize): number {
  const mod = 100 + Math.floor(300 / (5 - UFO_SIZE_INDEX[size]));
  return Math.min(100, Math.floor((accuracy * mod + 100) / 200));
}
export function reloadFor(def: CraftWeaponDef, stance: Stance): number {
  if (stance === 'cautious') return def.reloadCautious;
  if (stance === 'aggressive') return def.reloadAggressive;
  return def.reloadStandard;
}
export const isAttackStance = (s: Stance) => s === 'cautious' || s === 'standard' || s === 'aggressive';
export const difficultyCoefficient = (state: Pick<GameState, 'difficulty'>) => Math.max(0, Math.min(4, state.difficulty | 0));
export const ufoReload = (ufo: UfoTypeDef, state: Pick<GameState, 'difficulty'>) => Math.max(1, ufo.reload - 2 * difficultyCoefficient(state));
export const breakOffTime = (ufo: UfoTypeDef) => (ufo as any).breakOffTime ?? BREAK_OFF_BY_ID[normId(ufo.id)] ?? BREAK_OFF_BY_SIZE[ufo.size] ?? 500;
const normId = (id: string) => String(id).toLowerCase().replace(/[\s_]+/g, '-');

/** Where each stance takes the craft, given its weapons (cautious = longest range, standard = shortest). */
export function stanceTarget(e: Pick<Engagement, 'weapons'>, stance: Stance): number {
  const ranges = e.weapons.filter((w): w is WeaponState => !!w).map((w) => rangeUnits(w.def.range));
  switch (stance) {
    case 'cautious': return ranges.length ? Math.max(...ranges) : DOGFIGHT.standoffDistance;
    case 'standard': return ranges.length ? Math.min(...ranges) : DOGFIGHT.standoffDistance;
    case 'aggressive': return DOGFIGHT.minimumDistance;
    case 'disengage': return DOGFIGHT.disengageTarget;
    default: return DOGFIGHT.standoffDistance;
  }
}
export const crashThreshold = (ufo: UfoTypeDef) => Math.ceil(ufo.damageMax * DOGFIGHT.crashFraction);
export const ufoStatusFor = (ufo: UfoTypeDef, damage: number): Outcome | null =>
  damage >= ufo.damageMax ? 'destroyed' : damage >= crashThreshold(ufo) ? 'crashed' : null;

// ---------------------------------------------------------------------------------------------------------------
// Registry of live engagements (transient; never part of GameState).
const active: Engagement[] = [];
const ufoRecords = new Map<number, UfoCombat>();
let nextId = 1, globalTick = 0, lastResult: InterceptResult | null = null;
let resolveHandler: ResolveHandler | null = null;

export const listEngagements = (): readonly Engagement[] => active;
export const findEngagement = (id: number) => active.find((e) => e.id === id) ?? null;
export const engagementForCraft = (craftId: number) => active.find((e) => e.craftId === craftId) ?? null;
export const engagementsForUfo = (ufoId: number) => active.filter((e) => e.ufoId === ufoId);
export const lastInterceptResult = () => lastResult;
/** The Geoscape sim's `resolveInterception`, installed by hooks.ts; a local fallback applies when it is absent. */
export function setResolveHandler(h: ResolveHandler | null) { resolveHandler = h; }
export function removeEngagement(id: number) { const i = active.findIndex((e) => e.id === id); if (i >= 0) active.splice(i, 1); }
export function clearEngagements() { active.length = 0; ufoRecords.clear(); lastResult = null; }

function ufoRecord(ufoId: number, ufo: UfoTypeDef, state: GameState, rng: Rng): UfoCombat {
  let r = ufoRecords.get(ufoId);
  if (!r || r.down) {
    const base = breakOffTime(ufo);
    r = { ufoId, fireCountdown: 0, shootingAt: null, escapeCountdown: Math.max(1, base + rng.int(0, base) - 30 * difficultyCoefficient(state)), outrunning: false, down: null, killer: null, tick: -1 };
    ufoRecords.set(ufoId, r);
  }
  return r;
}

const findCraft = (state: GameState, id: number): Craft | undefined => state.craft.find((c) => c.id === id);
const findUfo = (state: GameState, id: number): Ufo | undefined => state.ufos.find((u) => u.id === id);
const fmtT = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function pushLog(e: Engagement, text: string, kind: LogKind = 'info') {
  e.log.push({ t: e.seconds, text, kind });
  if (e.log.length > DOGFIGHT.logLength) e.log.splice(0, e.log.length - DOGFIGHT.logLength);
}
export const logLine = (l: LogEntry) => `${fmtT(l.t)} ${l.text}`;

/**
 * Open an engagement window for a craft that has reached a UFO. Returns the existing one for that craft if it is
 * already engaged, or null when the concurrent-panel limit is reached (the caller then sends the craft home).
 */
export function startEngagement(state: GameState, craftId: number, ufoId: number, defs: InterceptDefs, opts: { seed?: number } = {}): Engagement | null {
  const existing = engagementForCraft(craftId);
  if (existing) return existing;
  if (active.filter((e) => !e.outcome).length >= DOGFIGHT.maxEngagements) return null;
  const craft = findCraft(state, craftId), ufo = findUfo(state, ufoId);
  if (!craft || !ufo) return null;
  const seed = opts.seed ?? hashSeed(`${state.seed}:${state.time}:${craftId}:${ufoId}:${nextId}`);
  const rng = new Rng(seed);
  const weapons: (WeaponState | null)[] = [];
  for (let i = 0; i < Math.max(defs.craft.weapons, defs.weapons.length); i++) {
    const def = defs.weapons[i] ?? null;
    weapons.push(def && craft.weapons[i] ? { slot: i, def, countdown: 0, shots: 0, hits: 0 } : null);
  }
  const e: Engagement = {
    id: nextId++, craftId, ufoId, craft: defs.craft, ufo: defs.ufo, craftName: craft.name, weapons,
    stance: 'standoff', distance: DOGFIGHT.startDistance, targetDistance: DOGFIGHT.standoffDistance, seconds: 0,
    status: 'STANDOFF', log: [], events: [], shared: ufoRecord(ufoId, defs.ufo, state, rng),
    outcome: null, closing: DOGFIGHT.closeDelay, resolved: false, result: null, rng,
  };
  if (state.compression !== 0) state.compression = 0; // the geoscape clock drops to 5-second steps for the fight
  active.push(e);
  pushLog(e, `${craft.name.toUpperCase()} ENGAGES ${defs.ufo.name.toUpperCase()} AT ${DOGFIGHT.startDistance}`);
  return e;
}

const STANCE_TEXT: Record<Stance, string> = { standoff: 'STANDOFF', cautious: 'CAUTIOUS ATTACK', standard: 'STANDARD ATTACK', aggressive: 'AGGRESSIVE ATTACK', disengage: 'DISENGAGE' };

export function setStance(e: Engagement, stance: Stance) {
  if (e.outcome) return;
  e.stance = stance;
  e.targetDistance = stanceTarget(e, stance);
  const verb = stance === 'disengage' ? 'OPEN TO' : e.distance > e.targetDistance ? 'CLOSE TO' : 'HOLD AT';
  pushLog(e, `${STANCE_TEXT[stance]} · ${verb} ${stance === 'disengage' ? DOGFIGHT.escapeDistance : e.targetDistance}`, stance === 'disengage' ? 'warn' : 'info');
  e.events.push({ kind: 'status', text: STANCE_TEXT[stance] });
  e.status = STANCE_TEXT[stance];
}

/** Craft weapon ammo lives in campaign state so a rearm after the fight sees the real count. */
const ammoOf = (craft: Craft, slot: number) => craft.weapons[slot]?.ammo ?? 0;

function craftFire(state: GameState, e: Engagement, craft: Craft, ufo: Ufo) {
  for (const w of e.weapons) {
    if (!w) continue;
    if (w.countdown > 0) w.countdown--;
    if (!isAttackStance(e.stance) || w.countdown > 0 || e.shared.down) continue;
    if (ammoOf(craft, w.slot) <= 0 || e.distance > rangeUnits(w.def.range)) continue;
    const slotState = craft.weapons[w.slot]!;
    slotState.ammo--;
    w.shots++;
    w.countdown = reloadFor(w.def, e.stance);
    const beam = w.def.ammoMax >= 99 && !w.def.ammoItem; // laser / plasma beams
    const hit = e.rng.percent(hitChance(w.def.accuracy, e.ufo.size));
    let damage = 0;
    if (hit) {
      damage = e.rng.int(Math.floor(w.def.damage * DOGFIGHT.craftDamageMinFraction), w.def.damage);
      ufo.damage = Math.min(e.ufo.damageMax, ufo.damage + damage);
      w.hits++;
      pushLog(e, `${w.def.name.toUpperCase()} HIT · UFO -${damage}`, 'ufo-hit');
      e.events.push({ kind: 'explosion', target: 'ufo', size: 'small' });
    } else pushLog(e, `${w.def.name.toUpperCase()} MISS`, 'miss');
    e.events.push({ kind: 'shot', from: 'craft', slot: w.slot, weapon: w.def.id, beam, hit, damage });
    const down = ufoStatusFor(e.ufo, ufo.damage);
    if (down) { e.shared.down = down; e.shared.killer = e.id; ufo.shotDownBy = craft.id; break; }
  }
}

function ufoFire(state: GameState, e: Engagement, craft: Craft) {
  const s = e.shared;
  if (s.down || e.ufo.weaponPower <= 0) return;
  const inRange = e.distance <= ufoRangeUnits(e.ufo);
  if (!inRange) { if (s.shootingAt === e.id) s.shootingAt = null; return; }
  const targetAlive = s.shootingAt !== null && active.some((o) => o.id === s.shootingAt && !o.outcome && o.distance <= ufoRangeUnits(e.ufo));
  if (!targetAlive) s.shootingAt = e.id;
  if (s.shootingAt !== e.id) return;
  if (s.fireCountdown > 0) return;
  s.fireCountdown = ufoReload(e.ufo, state);
  const hit = e.rng.percent(DOGFIGHT.ufoHitChance);
  let damage = 0;
  if (hit) {
    damage = e.rng.int(Math.floor(e.ufo.weaponPower * DOGFIGHT.ufoDamageMinFraction), e.ufo.weaponPower);
    craft.damage = Math.min(e.craft.damageMax, craft.damage + damage);
    pushLog(e, `UFO FIRE HIT · HULL -${damage}`, 'craft-hit');
    e.events.push({ kind: 'explosion', target: 'craft', size: 'small' });
  } else pushLog(e, 'UFO FIRE MISS', 'miss');
  e.events.push({ kind: 'shot', from: 'ufo', beam: true, hit, damage });
  // With a second interceptor in range the UFO may switch targets after a shot.
  const others = active.filter((o) => o.ufoId === e.ufoId && o.id !== e.id && !o.outcome && o.distance <= ufoRangeUnits(e.ufo));
  if (others.length && e.rng.percent(34)) s.shootingAt = e.rng.pick(others).id;
}

function finish(state: GameState, e: Engagement, outcome: Outcome, text: string) {
  if (e.outcome) return;
  e.outcome = outcome;
  e.status = text;
  e.closing = DOGFIGHT.closeDelay;
  pushLog(e, text, 'end');
  e.events.push({ kind: 'end', outcome });
  if (outcome === 'craft-destroyed') e.events.push({ kind: 'explosion', target: 'craft', size: 'large' });
  if ((outcome === 'destroyed' || outcome === 'crashed') && e.shared.killer === e.id) e.events.push({ kind: 'explosion', target: 'ufo', size: 'large' });
  const craft = findCraft(state, e.craftId), ufo = findUfo(state, e.ufoId);
  let shots = 0, hits = 0;
  for (const w of e.weapons) if (w) { shots += w.shots; hits += w.hits; }
  const result: InterceptResult = {
    craftId: e.craftId, ufoId: e.ufoId, outcome,
    ufoDamage: ufo?.damage ?? 0, craftDamage: craft?.damage ?? 0, seconds: e.seconds, shots, hits,
  };
  e.result = result; lastResult = result;
  try { if (resolveHandler) resolveHandler(state, result); else fallbackResolve(state, result, e); } catch (err) { console.error('resolveInterception failed', err); }
  e.resolved = true;
}

/** Advance one engagement by whole seconds. Returns the events raised (also left on `e.events` for the scene). */
export function step(state: GameState, e: Engagement, seconds = 1): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < Math.max(0, Math.floor(seconds)); i++) { globalTick++; tick(state, e, globalTick); out.push(...e.events); }
  return out;
}
/** Advance every live engagement together (shared UFO timers tick once). Finished panels are dropped after their delay. */
export function stepAll(state: GameState, seconds = 1) {
  for (let i = 0; i < Math.max(0, Math.floor(seconds)); i++) {
    globalTick++;
    for (const e of [...active]) tick(state, e, globalTick);
    for (const e of [...active]) if (e.outcome && e.closing <= 0) removeEngagement(e.id);
  }
}

function tick(state: GameState, e: Engagement, tickId: number) {
  e.events = [];
  if (e.outcome) { if (e.closing > 0) e.closing--; return; }
  const craft = findCraft(state, e.craftId), ufo = findUfo(state, e.ufoId);
  if (!craft) { finish(state, e, 'disengaged', 'CONTACT LOST'); return; }
  if (!ufo || (ufo.status !== 'flying' && !e.shared.down)) { finish(state, e, 'disengaged', ufo?.status === 'landed' ? 'UFO LANDED · RETURN TO BASE' : 'CONTACT LOST'); return; }
  e.seconds++;
  const s = e.shared;
  if (s.down) { finish(state, e, 'disengaged', s.down === 'destroyed' ? 'UFO DESTROYED · RETURN TO BASE' : 'UFO CRASH LANDS · RETURN TO BASE'); return; }
  if ((craft.lowFuel || craft.returning) && e.stance !== 'disengage') { pushLog(e, 'LOW FUEL · DISENGAGING', 'warn'); setStance(e, 'disengage'); }

  // Shared UFO timers advance once per tick regardless of how many windows are open on it.
  if (s.tick !== tickId) {
    s.tick = tickId;
    if (s.fireCountdown > 0 && active.some((o) => o.ufoId === e.ufoId && !o.outcome && o.distance <= ufoRangeUnits(e.ufo))) s.fireCountdown--;
    if (!s.outrunning && s.escapeCountdown > 0) {
      s.escapeCountdown--;
      if (s.escapeCountdown === 0) {
        // Full speed: only a UFO faster than every craft on it can break away.
        const fastest = Math.max(...active.filter((o) => o.ufoId === e.ufoId && !o.outcome).map((o) => o.craft.speedMax));
        if (e.ufo.speedMax > fastest) { s.outrunning = true; for (const o of engagementsForUfo(e.ufoId)) { pushLog(o, 'UFO OUTRUNNING INTERCEPTOR', 'warn'); o.events.push({ kind: 'status', text: 'UFO OUTRUNNING INTERCEPTOR' }); } }
        else for (const o of engagementsForUfo(e.ufoId)) pushLog(o, 'UFO AT FULL SPEED · CANNOT OUTRUN', 'info');
      }
    }
  }

  // Distance.
  if (s.outrunning) e.distance += DOGFIGHT.openRate;
  else if (e.distance > e.targetDistance) e.distance = Math.max(e.targetDistance, e.distance - DOGFIGHT.closeRate);
  else if (e.distance < e.targetDistance) e.distance = Math.min(e.targetDistance, e.distance + DOGFIGHT.openRate);

  // Exchange of fire.
  craftFire(state, e, craft, ufo);
  if (!s.down) ufoFire(state, e, craft);

  // Outcomes.
  if (craft.damage >= e.craft.damageMax) { finish(state, e, 'craft-destroyed', 'INTERCEPTOR DESTROYED'); return; }
  if (s.down) { finish(state, e, s.down, s.down === 'destroyed' ? 'UFO DESTROYED' : 'UFO CRASH LANDS'); return; }
  if (s.outrunning && e.distance > DOGFIGHT.escapeDistance) { finish(state, e, 'escaped', 'UFO ESCAPED'); return; }
  if (e.stance === 'disengage' && e.distance > DOGFIGHT.escapeDistance) { finish(state, e, 'disengaged', 'DISENGAGED · RETURN TO BASE'); return; }
  if (e.stance === 'cautious' && craft.damage >= e.craft.damageMax * DOGFIGHT.cautiousRetreatFraction) {
    pushLog(e, 'HULL DAMAGE 50% · STANDOFF', 'warn');
    e.stance = 'standoff'; e.targetDistance = DOGFIGHT.standoffDistance; e.events.push({ kind: 'status', text: 'STANDOFF' });
  }
  e.status = s.outrunning ? 'UFO OUTRUNNING INTERCEPTOR'
    : e.distance > e.targetDistance ? `${STANCE_TEXT[e.stance]} · CLOSING`
    : e.distance < e.targetDistance ? `${STANCE_TEXT[e.stance]} · OPENING`
    : `${STANCE_TEXT[e.stance]} · HOLDING`;
}

/** Plain-JSON view for test hooks and critics. */
export function snapshot(e: Engagement) {
  return {
    id: e.id, craftId: e.craftId, ufoId: e.ufoId, craft: e.craft.id, ufo: e.ufo.id, stance: e.stance,
    distance: e.distance, targetDistance: e.targetDistance, seconds: e.seconds, status: e.status, outcome: e.outcome,
    closing: e.closing, resolved: e.resolved, outrunning: e.shared.outrunning, escapeCountdown: e.shared.escapeCountdown,
    ufoFireCountdown: e.shared.fireCountdown,
    weapons: e.weapons.map((w) => (w ? { slot: w.slot, id: w.def.id, countdown: w.countdown, shots: w.shots, hits: w.hits, range: rangeUnits(w.def.range) } : null)),
    log: e.log.map(logLine),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Fallback resolution used only while the Geoscape sim's resolveInterception is unavailable: applies the minimum the
// campaign needs (UFO status, crash site, craft home, score) so the game keeps working.
function fallbackResolve(state: GameState, r: InterceptResult, e: Engagement) {
  const craft = findCraft(state, r.craftId), ufo = findUfo(state, r.ufoId);
  if (ufo) {
    ufo.damage = r.ufoDamage;
    if (r.outcome === 'destroyed' || r.outcome === 'crashed') {
      ufo.status = r.outcome; ufo.shotDownBy = r.craftId;
      ufo.interceptingCraft = [];
      state.stats.ufosShotDown++;
      state.monthScore.xcom += e.ufo.score;
      if (r.outcome === 'crashed') {
        const days = e.rng.int(1, 3);
        ufo.crashedUntil = state.time + days * 86_400_000;
        state.sites.push({ id: state.nextId++, kind: 'crash', lon: ufo.lon, lat: ufo.lat, race: ufo.race, ufoType: ufo.type, ufoId: ufo.id, expiresAt: ufo.crashedUntil, detected: true, terrainSet: '', region: '', createdAt: state.time });
      }
    } else if (r.outcome === 'escaped') ufo.escaping = true;
  }
  if (craft) {
    craft.damage = r.craftDamage; craft.interceptingUfo = null;
    if (r.outcome === 'craft-destroyed') {
      for (const sol of state.soldiers) if (sol.craftId === craft.id) { sol.dead = { date: state.time, mission: 'Interception', cause: `${craft.name} destroyed` }; state.memorial.push(sol); state.stats.soldiersLost++; }
      state.soldiers = state.soldiers.filter((sol) => sol.craftId !== craft.id);
      state.craft = state.craft.filter((c) => c.id !== craft.id);
    } else {
      const base = state.bases.find((b) => b.id === craft.baseId);
      craft.dest = base ? { kind: 'base', id: base.id, lon: base.lon, lat: base.lat } : null;
      craft.returning = true; craft.interceptingUfo = null;
    }
  }
}
