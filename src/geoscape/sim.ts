// Geoscape simulation: time, alien missions, UFOs, radar, craft, interception results, monthly council, mission outcomes.
import { COMPRESSION_SECONDS, type GameState, type Ufo, type Craft, type Site, type AlienMission, type MonthlyReport, type Base } from '../core/state';
import { bus, type GeoEvent } from '../core/events';
import { monthIndex, HOUR, DAY, MINUTE, daysInMonth, monthName } from '../core/clock';
import { campaignRng, nextId, baseById, craftById } from '../core/campaign';
import { UFOS } from '../data/ufos';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { FACILITIES } from '../data/facilities';
import { REGIONS, COUNTRIES, regionAt, countryAt, inBox } from '../data/countries';
import { ALIEN_MISSIONS, MISSION_SCHEDULE, RACE_BY_MONTH } from '../data/missions';
import { SCORE, FUNDING } from '../data/score';
import { ITEMS } from '../data/items';
import { terrainFor } from '../data/terrain';
import { dailyResearch } from '../research/sim';
import { hourlyManufacture } from '../manufacture/sim';
import { advanceBases, capacities, maintenance as baseMaintenance, storesOver } from '../base/sim';
import { salary } from '../soldiers/roster';
import { autosave } from '../core/save';

export interface GeoEventRecord { type: GeoEvent; text: string; halt: boolean; ufoId?: number; craftId?: number; siteId?: number; baseId?: number; topic?: string; }
const KM_PER_DEG = 111.32, KNOT_KMH = 1.852, EARTH_R = 6371;
export const kmBetween = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => { const toR = Math.PI / 180; const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2; return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h))); };
const wrapLon = (l: number) => ((l + 540) % 360) - 180;
/** Move `o` toward `dest` at `knots` for `seconds`. Returns true on arrival. */
function moveToward(o: { lon: number; lat: number }, dest: { lon: number; lat: number }, knots: number, seconds: number): boolean {
  const dist = kmBetween(o, dest); const step = (knots * KNOT_KMH * seconds) / 3600;
  if (dist <= step || dist < 0.5) { o.lon = dest.lon; o.lat = dest.lat; return true; }
  const f = step / dist; let dLon = dest.lon - o.lon; if (dLon > 180) dLon -= 360; if (dLon < -180) dLon += 360;
  o.lon = wrapLon(o.lon + dLon * f); o.lat = o.lat + (dest.lat - o.lat) * f; return false;
}
const events: GeoEventRecord[] = [];
function emit(state: GameState, e: GeoEventRecord) { events.push(e); if (e.halt) state.paused = true; bus.emit(e.type, e); }
const toastEvent = (state: GameState, type: GeoEvent, text: string, extra: Partial<GeoEventRecord> = {}, halt = true) => emit(state, { type, text, halt, ...extra });

// ---------- Scoring ----------
export function addScore(state: GameState, side: 'xcom' | 'alien', points: number, lon?: number, lat?: number) {
  if (side === 'xcom') state.monthScore.xcom += points; else state.monthScore.alien += points;
  if (lon !== undefined && lat !== undefined) {
    const r = regionAt(lon, lat); const ra = (state.regionActivity[r.id] ??= { alien: 0, xcom: 0 }); if (side === 'xcom') ra.xcom += points; else ra.alien += points;
    const c = countryAt(lon, lat); if (c) { const cs = state.countries.find((x) => x.id === c.id); if (cs) { if (side === 'xcom') cs.activityXcom += points; else cs.activityAlien += points; } }
  }
}

// ---------- Alien missions and UFOs ----------
function pickRace(state: GameState, rng: ReturnType<typeof campaignRng>): string {
  const band = MISSION_SCHEDULE.bandOfMonth(monthIndex(state.time));
  const items = Object.entries(RACE_BY_MONTH).map(([id, w]) => ({ item: id, w: w[band] })).filter((x) => x.w > 0);
  return rng.weighted(items);
}
export function startMission(state: GameState, type: string, regionId: string, race?: string, targetBaseId?: number): AlienMission {
  const rng = campaignRng(state);
  const m: AlienMission = { id: nextId(state), type, race: race ?? pickRace(state, rng), region: regionId, wave: 0, ufosLaunched: 0, nextUfoAt: state.time + rng.int(1, 12) * HOUR, done: false, targetBaseId, aliensSuccess: 0 };
  if (type === 'terror') { const cities = REGIONS[regionId].cities; if (cities.length) m.targetCity = rng.pick(cities).name; }
  rng.save(); state.missions.push(m); return m;
}
function randomPointIn(region: typeof REGIONS[string], rng: ReturnType<typeof campaignRng>) { const a = rng.pick(region.areas); return { lon: rng.int(a[0] * 10, a[1] * 10) / 10, lat: rng.int(a[2] * 10, a[3] * 10) / 10 }; }
function spawnMissionUfo(state: GameState, m: AlienMission) {
  const def = ALIEN_MISSIONS[m.type]; const wave = def.waves[m.wave]; if (!wave) { m.done = true; return; }
  const rng = campaignRng(state); const region = REGIONS[m.region] ?? REGIONS['europe'];
  const start = randomPointIn(region, rng); start.lon = wrapLon(start.lon + rng.int(-15, 15)); start.lat = Math.max(-80, Math.min(80, start.lat + rng.int(-10, 10)));
  const traj: Ufo['trajectory'] = [];
  const n = rng.int(3, 5);
  for (let i = 0; i < n; i++) traj.push({ ...randomPointIn(region, rng), altitude: i === n - 1 && wave.landsAt ? 'ground' : (rng.pick(['high', 'low', 'very-low']) as Ufo['altitude']) });
  let landAt: { lon: number; lat: number } | null = null;
  if (wave.landsAt === 'city' && m.targetCity) { const c = region.cities.find((x) => x.name === m.targetCity); if (c) landAt = { lon: c.lon, lat: c.lat }; }
  if (wave.landsAt === 'base') { const target = wave.ufo === 'supply-ship' ? state.sites.find((s) => s.kind === 'alien-base' && s.race === m.race && s.region === m.region) : baseById(state, m.targetBaseId ?? -1); if (target) landAt = { lon: target.lon, lat: target.lat }; }
  if (landAt) traj[traj.length - 1] = { ...landAt, altitude: 'ground' };
  const exit = { ...randomPointIn(region, rng), altitude: 'very-high' as const }; exit.lon = wrapLon(exit.lon + rng.int(-30, 30)); traj.push(exit);
  const ut = UFOS[wave.ufo];
  const ufo: Ufo = { id: nextId(state), type: wave.ufo, race: m.race, missionId: m.id, lon: start.lon, lat: start.lat, altitude: 'high', speed: Math.round(ut.speedMax * rng.int(40, 90) / 100), heading: 0, dest: { lon: traj[0].lon, lat: traj[0].lat }, waypoint: 0, status: 'flying', damage: 0, detected: false, hyperDetected: false, trajectory: traj };
  state.ufos.push(ufo); m.ufosLaunched++;
  if (m.ufosLaunched >= wave.count) { m.wave++; m.ufosLaunched = 0; if (m.wave >= def.waves.length) m.done = true; }
  m.nextUfoAt = state.time + wave.timerMinutes * MINUTE;
  rng.save();
}
function ufoArrivedAtWaypoint(state: GameState, ufo: Ufo) {
  const wp = ufo.trajectory[ufo.waypoint]; const m = state.missions.find((x) => x.id === ufo.missionId); const rng = campaignRng(state);
  if (wp.altitude === 'ground' && ufo.status === 'flying') {
    ufo.status = 'landed'; ufo.altitude = 'ground'; ufo.landedUntil = state.time + rng.int(1, 6) * HOUR;
    const def = m ? ALIEN_MISSIONS[m.type] : null; const wave = def && m ? def.waves[Math.max(0, m.wave - (m.ufosLaunched === 0 ? 1 : 0))] : null;
    const region = regionAt(ufo.lon, ufo.lat);
    if (m && wave?.landsAt === 'city' && m.type === 'terror') {
      const site: Site = { id: nextId(state), kind: 'terror', lon: ufo.lon, lat: ufo.lat, race: ufo.race, ufoId: ufo.id, expiresAt: state.time + rng.int(36, 72) * HOUR, detected: true, terrainSet: 'urban', city: m.targetCity, region: region.id, createdAt: state.time };
      state.sites.push(site); addScore(state, 'alien', FUNDING.alienActivityPerTerrorSite, ufo.lon, ufo.lat);
      toastEvent(state, 'terror-site', `Terror site: ${m.targetCity ?? 'unknown city'}`, { siteId: site.id });
      ufo.landedUntil = state.time + 48 * HOUR;
    } else if (m && m.type === 'base' && m.done) {
      const site: Site = { id: nextId(state), kind: 'alien-base', lon: ufo.lon, lat: ufo.lat, race: ufo.race, expiresAt: null, detected: false, terrainSet: 'alien-base', region: region.id, createdAt: state.time, supplyCount: 0 };
      state.sites.push(site); state.alienBaseCount = (state.alienBaseCount ?? 0) + 1;
    } else if (m && m.type === 'infiltration' && m.done) {
      const country = state.countries.find((c) => COUNTRIES[c.id].areas.some((a) => inBox(ufo.lon, ufo.lat, a)) && !c.pact) ?? state.countries.find((c) => COUNTRIES[c.id].region === region.id && !c.pact);
      if (country) { country.pact = true; country.funding = 0; addScore(state, 'alien', FUNDING.alienActivityPerPact, ufo.lon, ufo.lat); toastEvent(state, 'pact', `${COUNTRIES[country.id].name} has signed a pact with the aliens`, {}); }
    } else if (m && m.type === 'retaliation' && wave?.landsAt === 'base') {
      const base = baseById(state, m.targetBaseId ?? -1);
      if (base) { ufo.status = 'flying'; baseAttack(state, base, ufo); }
    } else {
      const site: Site = { id: nextId(state), kind: 'landed', lon: ufo.lon, lat: ufo.lat, race: ufo.race, ufoType: ufo.type, ufoId: ufo.id, expiresAt: ufo.landedUntil, detected: ufo.detected, terrainSet: terrainFor(ufo.lon, ufo.lat, ufo.id), region: region.id, createdAt: state.time };
      state.sites.push(site); if (ufo.detected) toastEvent(state, 'ufo-landed', `${UFOS[ufo.type].name} has landed`, { ufoId: ufo.id, siteId: site.id });
    }
  }
  rng.save();
  if (ufo.status === 'flying') { ufo.waypoint++; if (ufo.waypoint >= ufo.trajectory.length) { removeUfo(state, ufo, 'left'); return; } const n = ufo.trajectory[ufo.waypoint]; ufo.dest = { lon: n.lon, lat: n.lat }; ufo.altitude = n.altitude === 'ground' ? 'very-low' : n.altitude; }
}
function baseAttack(state: GameState, base: Base, ufo: Ufo) {
  const rng = campaignRng(state); let dmg = 0; const ut = UFOS[ufo.type];
  for (const f of base.facilities.filter((x) => x.daysLeft <= 0)) { const d = FACILITIES[f.def]; if (d?.defenceDamage && rng.percent(d.defenceHit ?? 50)) dmg += d.defenceDamage; }
  rng.save();
  if (dmg >= ut.damageMax) { removeUfo(state, ufo, 'destroyed'); addScore(state, 'xcom', ut.score, base.lon, base.lat); toastEvent(state, 'base-attacked', `${base.name}: base defences destroyed the attacking ${ut.name}`, { baseId: base.id }); return; }
  ufo.status = 'landed'; ufo.lon = base.lon; ufo.lat = base.lat;
  state.pendingMission = { baseId: base.id, kind: 'base-defence' };
  (state.pendingMission as any).ufoId = ufo.id; (state.pendingMission as any).race = ufo.race;
  toastEvent(state, 'base-attacked', `${base.name} is under attack`, { baseId: base.id, ufoId: ufo.id });
}
function removeUfo(state: GameState, ufo: Ufo, why: 'left' | 'destroyed' | 'crashed-expired') {
  state.ufos = state.ufos.filter((u) => u.id !== ufo.id);
  state.sites = state.sites.filter((s) => s.ufoId !== ufo.id || s.kind === 'terror');
  for (const c of state.craft) if (c.dest?.kind === 'ufo' && c.dest.id === ufo.id) returnToBase(state, c.id);
  if (why === 'left' && ufo.detected) toastEvent(state, 'ufo-escaped', `${UFOS[ufo.type].name} has left the area`, { ufoId: ufo.id }, false);
}
function updateUfo(state: GameState, ufo: Ufo, seconds: number) {
  if (ufo.status === 'flying' && ufo.dest) { if (moveToward(ufo, ufo.dest, ufo.speed, seconds)) ufoArrivedAtWaypoint(state, ufo); }
  else if (ufo.status === 'landed' && ufo.landedUntil !== undefined && state.time >= ufo.landedUntil) {
    const m = state.missions.find((x) => x.id === ufo.missionId);
    if (m?.type === 'terror') { const site = state.sites.find((s) => s.ufoId === ufo.id && s.kind === 'terror'); if (site) site.ufoId = undefined; }
    ufo.status = 'flying'; ufo.altitude = 'very-low'; state.sites = state.sites.filter((s) => !(s.ufoId === ufo.id && s.kind === 'landed'));
    ufo.waypoint++; if (ufo.waypoint >= ufo.trajectory.length) removeUfo(state, ufo, 'left'); else { const n = ufo.trajectory[ufo.waypoint]; ufo.dest = { lon: n.lon, lat: n.lat }; }
  } else if (ufo.status === 'crashed' && ufo.crashedUntil !== undefined && state.time >= ufo.crashedUntil) removeUfo(state, ufo, 'crashed-expired');
}
function radarCoverage(state: GameState, ufo: Ufo): { covered: boolean; hyper: boolean; chance: number } {
  let covered = false, hyper = false, chance = 0;
  for (const b of state.bases) for (const f of b.facilities) { if (f.daysLeft > 0) continue; const d = FACILITIES[f.def]; if (!d?.radarRange) continue; if (kmBetween(b, ufo) <= d.radarRange) { covered = true; chance = Math.max(chance, d.radarChance ?? 0); if (d.hyperwave) hyper = true; } }
  for (const c of state.craft) if (c.status === 'out' && kmBetween(c, ufo) <= CRAFT[c.type].radarRange) { covered = true; chance = 100; }
  return { covered, hyper, chance };
}
function detectionSweep(state: GameState) {
  const rng = campaignRng(state);
  for (const ufo of state.ufos) {
    if (ufo.status === 'crashed') continue;
    const cov = radarCoverage(state, ufo);
    if (!ufo.detected) {
      if (cov.covered && (cov.hyper || rng.percent(cov.chance * (UFOS[ufo.type].radarProfile / 100)))) {
        ufo.detected = true; ufo.hyperDetected = cov.hyper; const site = state.sites.find((s) => s.ufoId === ufo.id); if (site) site.detected = true;
        toastEvent(state, 'ufo-detected', `UFO detected: ${cov.hyper ? `${UFOS[ufo.type].name} (${ufo.race})` : 'unknown craft'} ${ufo.status === 'landed' ? '(landed)' : ''}`, { ufoId: ufo.id });
      }
    } else if (!cov.covered && ufo.status === 'flying') { ufo.detected = false; toastEvent(state, 'ufo-lost', 'Contact lost', { ufoId: ufo.id }, false); }
    else if (cov.hyper && !ufo.hyperDetected) ufo.hyperDetected = true;
  }
  // alien bases discovered by hyperwave or a craft passing within 100 km
  for (const s of state.sites) if (s.kind === 'alien-base' && !s.detected) {
    const near = state.craft.some((c) => c.status === 'out' && kmBetween(c, s) < 100) || state.bases.some((b) => b.facilities.some((f) => f.daysLeft <= 0 && FACILITIES[f.def]?.hyperwave && kmBetween(b, s) <= 2400));
    if (near) { s.detected = true; toastEvent(state, 'alien-base-found', 'Alien base located', { siteId: s.id }); }
  }
  // retaliation scouts locate a base by passing within 200 km
  for (const ufo of state.ufos) { const m = state.missions.find((x) => x.id === ufo.missionId); if (m?.type === 'retaliation' && m.targetBaseId) { const b = baseById(state, m.targetBaseId); if (b && !b.scanned && kmBetween(b, ufo) < 200) b.scanned = true; } }
  rng.save();
}

// ---------- Craft ----------
export function sendCraft(state: GameState, craftId: number, dest: Craft['dest']): boolean {
  const c = craftById(state, craftId); if (!c || !dest) return false;
  if (c.status !== 'ready' && c.status !== 'out') return false;
  let d: NonNullable<Craft['dest']> = dest;
  if (d.kind === 'ufo') { const u = state.ufos.find((x) => x.id === d.id); if (!u) return false; d = { ...d, lon: u.lon, lat: u.lat }; }
  if (d.kind === 'site') { const s = state.sites.find((x) => x.id === d.id); if (!s) return false; d = { ...d, lon: s.lon, lat: s.lat }; }
  c.dest = d; c.status = 'out'; c.speed = CRAFT[c.type].speedMax; c.returning = false; c.patrol = d.kind === 'point';
  return true;
}
export function returnToBase(state: GameState, craftId: number) { const c = craftById(state, craftId); if (!c) return; const b = baseById(state, c.baseId); if (!b) return; c.dest = { kind: 'base', id: b.id, lon: b.lon, lat: b.lat }; c.returning = true; c.patrol = false; c.status = 'out'; c.speed = CRAFT[c.type].speedMax; }
function fuelNeededToReturn(c: Craft, base: Base): number { const def = CRAFT[c.type]; const hours = kmBetween(c, base) / (def.speedMax * KNOT_KMH); const perTenMin = def.fuelItem ? 1 : Math.max(1, Math.floor(def.speedMax / 100)); return Math.ceil(hours * 6 * perTenMin); }
function updateCraft(state: GameState, c: Craft, seconds: number) {
  if (c.status !== 'out') return; const def = CRAFT[c.type]; const base = baseById(state, c.baseId); if (!base) return;
  if (c.dest?.kind === 'ufo') { const u = state.ufos.find((x) => x.id === c.dest!.id); if (!u || (u.status === 'flying' && !u.detected)) { returnToBase(state, c.id); toastEvent(state, 'craft-returned', `${c.name}: target lost, returning to base`, { craftId: c.id }, false); return; } c.dest.lon = u.lon; c.dest.lat = u.lat; }
  if (!c.dest) { returnToBase(state, c.id); return; }
  const arrived = moveToward(c, c.dest, def.speedMax, seconds);
  if (c.dest.kind === 'ufo') {
    const u = state.ufos.find((x) => x.id === c.dest!.id)!;
    if (kmBetween(c, u) < 10) {
      if (u.status === 'flying' && def.weapons > 0) { if (!c.interceptingUfo) { c.interceptingUfo = u.id; toastEvent(state, 'intercept', `${c.name} has reached the ${u.hyperDetected ? UFOS[u.type].name : 'UFO'}`, { craftId: c.id, ufoId: u.id }); } }
      else if (u.status === 'flying') { c.dest = null; returnToBase(state, c.id); }
      else { const site = state.sites.find((s) => s.ufoId === u.id && (s.kind === 'landed' || s.kind === 'crash')); if (site && def.soldiers > 0) { arriveAtSite(state, c, site); } else if (!site) returnToBase(state, c.id); }
    }
  } else if (arrived) {
    if (c.dest.kind === 'base') { c.status = 'refuelling'; c.dest = null; c.returning = false; c.interceptingUfo = null; toastEvent(state, 'craft-returned', `${c.name} has returned to ${base.name}`, { craftId: c.id }, false); }
    else if (c.dest.kind === 'site') { const s = state.sites.find((x) => x.id === c.dest!.id); if (s && def.soldiers > 0) arriveAtSite(state, c, s); else returnToBase(state, c.id); }
    else if (c.dest.kind === 'point' || c.dest.kind === 'waypoint') { c.patrol = true; }
  }
}
function arriveAtSite(state: GameState, c: Craft, site: Site) {
  if (state.pendingMission) return;
  c.dest = { kind: 'site', id: site.id, lon: site.lon, lat: site.lat }; c.speed = 0;
  state.pendingMission = { siteId: site.id, craftId: c.id, kind: site.kind };
  toastEvent(state, 'craft-arrived', `${c.name} has reached the ${site.kind === 'terror' ? 'terror site' : site.kind === 'alien-base' ? 'alien base' : site.kind === 'crash' ? 'crash site' : 'landing site'}`, { craftId: c.id, siteId: site.id });
}
function tenMinuteCraft(state: GameState) {
  for (const c of state.craft) {
    if (c.status !== 'out') continue; const def = CRAFT[c.type]; const base = baseById(state, c.baseId); if (!base) continue;
    c.fuel -= def.fuelItem ? 1 : Math.max(1, Math.floor(def.speedMax / 100));
    if (c.fuel <= 0) { c.fuel = 0; if (!c.returning) returnToBase(state, c.id); }
    else if (!c.returning && !c.lowFuel && c.fuel <= fuelNeededToReturn(c, base) + 2) { c.lowFuel = true; returnToBase(state, c.id); toastEvent(state, 'craft-low-fuel', `${c.name}: low fuel, returning to base`, { craftId: c.id }); }
  }
}
function thirtyMinuteCraft(state: GameState) {
  for (const c of state.craft) {
    if (c.status === 'out') continue; const def = CRAFT[c.type]; const base = baseById(state, c.baseId); if (!base) continue;
    if (c.damage > 0) { c.status = 'repairs'; c.damage = Math.max(0, c.damage - def.repairRate); if (c.damage > 0) continue; }
    let rearming = false;
    for (const w of c.weapons) { if (!w) continue; const wd = CRAFT_WEAPONS[w.def]; if (w.ammo < wd.ammoMax) { if (wd.ammoItem) { const have = base.items[wd.ammoItem] ?? 0; if (have <= 0) continue; const take = Math.min(have, Math.min(wd.rearmRate, wd.ammoMax - w.ammo)); base.items[wd.ammoItem] = have - take; w.ammo += take; } else w.ammo = wd.ammoMax; if (w.ammo < wd.ammoMax) rearming = true; } }
    if (rearming) { c.status = 'rearming'; continue; }
    if (c.fuel < def.fuelMax) { if (def.fuelItem) { const have = base.items[def.fuelItem] ?? 0; if (have > 0) { base.items[def.fuelItem] = have - 1; c.fuel += 1; } } else c.fuel = Math.min(def.fuelMax, c.fuel + def.refuelRate); c.status = c.fuel >= def.fuelMax ? 'ready' : 'refuelling'; if (c.status === 'ready') { c.lowFuel = false; toastEvent(state, 'craft-refuelled', `${c.name} is ready`, { craftId: c.id }, false); } continue; }
    c.status = 'ready'; c.lowFuel = false;
  }
}

// ---------- Interception outcome ----------
export interface InterceptOutcome { craftId: number; ufoId: number; outcome: 'destroyed' | 'crashed' | 'escaped' | 'disengaged' | 'craft-destroyed'; ufoDamage: number; craftDamage: number }
export function resolveInterception(state: GameState, r: InterceptOutcome) {
  const c = craftById(state, r.craftId); const u = state.ufos.find((x) => x.id === r.ufoId); const rng = campaignRng(state);
  if (c) { c.damage = Math.min(CRAFT[c.type].damageMax, r.craftDamage); c.interceptingUfo = null; }
  if (u) {
    u.damage = r.ufoDamage; const ut = UFOS[u.type];
    if (r.outcome === 'destroyed') { removeUfo(state, u, 'destroyed'); addScore(state, 'xcom', ut.score, u.lon, u.lat); state.stats.ufosShotDown++; toastEvent(state, 'ufo-destroyed', `${ut.name} destroyed`, { ufoId: u.id }); }
    else if (r.outcome === 'crashed') {
      u.status = 'crashed'; u.altitude = 'ground'; u.dest = null; u.crashedUntil = state.time + rng.int(24, 72) * HOUR; state.stats.ufosShotDown++;
      state.sites = state.sites.filter((s) => s.ufoId !== u.id);
      const site: Site = { id: nextId(state), kind: 'crash', lon: u.lon, lat: u.lat, race: u.race, ufoType: u.type, ufoId: u.id, expiresAt: u.crashedUntil, detected: true, terrainSet: terrainFor(u.lon, u.lat, u.id), region: regionAt(u.lon, u.lat).id, createdAt: state.time };
      state.sites.push(site); addScore(state, 'xcom', ut.score, u.lon, u.lat); toastEvent(state, 'ufo-crashed', `${ut.name} crash-landed`, { ufoId: u.id, siteId: site.id });
    } else if (r.outcome === 'escaped') { u.escaping = true; u.speed = ut.speedMax; }
  }
  if (c) { if (r.outcome === 'craft-destroyed') { for (const sid of c.soldiers) { const s = state.soldiers.find((x) => x.id === sid); if (s) { s.dead = { date: state.time, mission: 'Interception', cause: 'Lost with craft' }; state.memorial.push(s); } } state.soldiers = state.soldiers.filter((s) => !c.soldiers.includes(s.id)); state.craft = state.craft.filter((x) => x.id !== c.id); toastEvent(state, 'craft-returned', `${c.name} was destroyed`, {}); } else returnToBase(state, c.id); }
  rng.save();
}

// ---------- Monthly council ----------
export function ratingFor(score: number) { return FUNDING.ratings.find((r) => score >= r.min)!.text; }
export function rollMonth(state: GameState): MonthlyReport {
  const rng = campaignRng(state); const d = new Date(state.time);
  const score = state.monthScore.xcom - state.monthScore.alien;
  const changes: MonthlyReport['fundingChanges'] = [];
  for (const cs of state.countries) {
    const before = cs.funding; const def = COUNTRIES[cs.id];
    if (cs.pact) { changes.push({ country: cs.id, before, after: 0, pact: true }); cs.funding = 0; continue; }
    const good = Math.floor(state.monthScore.xcom / 10) + cs.activityXcom, bad = Math.floor(state.monthScore.alien / 20) + cs.activityAlien;
    let after = before; const pct = rng.int(FUNDING.fundingChangeMinPct, FUNDING.fundingChangeMaxPct);
    if (good > bad + 30 && rng.int(0, good) > bad) after = Math.min(def.fundingMax * 2, Math.round((before * (100 + pct)) / 100 / 1000) * 1000);
    else if (good < bad - 30 && rng.int(0, bad) > good) after = Math.max(0, Math.round((before * (100 - pct)) / 100 / 1000) * 1000);
    cs.funding = after; cs.activityAlien = 0; cs.activityXcom = 0; changes.push({ country: cs.id, before, after });
  }
  const totalFunding = state.countries.reduce((a, c) => a + c.funding, 0);
  const salaries = state.soldiers.reduce((a, s) => a + salary(s.rank), 0) + state.bases.reduce((a, b) => a + b.scientists * FUNDING.salaries.scientist + b.engineers * FUNDING.salaries.engineer, 0);
  const maint = state.bases.reduce((a, b) => a + baseMaintenance(state, b).total, 0);
  state.funds += totalFunding - salaries - maint;
  const threshold = SCORE.monthlyMinimum[state.difficulty];
  const warning = score <= threshold; const bankrupt = state.funds < 0;
  if (warning) state.warningsIssued++; else state.warningsIssued = 0;
  const councilOut = state.warningsIssued >= FUNDING.consecutivePoorMonthsToLose || state.countries.every((c) => c.pact);
  const report: MonthlyReport = { month: d.getUTCMonth(), year: d.getUTCFullYear(), score, xcomScore: state.monthScore.xcom, alienScore: state.monthScore.alien, fundingChanges: changes, totalFunding, rating: ratingFor(score), warning, gameOver: bankrupt || councilOut };
  state.reports.push(report); state.lastMonthlyScore = score; state.monthScore = { xcom: 0, alien: 0 }; state.regionActivity = {}; state.monthsElapsed++;
  if (bankrupt) state.gameOver = { reason: 'bankrupt', text: 'X-COM funds are exhausted. The Funding Council has terminated the project.' };
  else if (councilOut) state.gameOver = { reason: 'council', text: 'After two months of unacceptable results the Funding Council has withdrawn its support.' };
  // schedule next month's alien activity
  const m = monthIndex(state.time); const band = MISSION_SCHEDULE.bandOfMonth(m);
  const regions = Object.keys(REGIONS).filter((r) => REGIONS[r].cities.length > 0);
  for (let i = 0; i < MISSION_SCHEDULE.perMonth[state.difficulty]; i++) { const type = rng.weighted(Object.entries(MISSION_SCHEDULE.weights).map(([k, w]) => ({ item: k, w: w[band] }))); startMission(state, type, rng.pick(regions)); }
  if (m >= MISSION_SCHEDULE.terrorFromMonth) startMission(state, 'terror', rng.pick(regions));
  for (const s of state.sites) if (s.kind === 'alien-base') { startMission(state, 'supply', s.region, s.race); addScore(state, 'alien', FUNDING.alienActivityPerBaseMonth, s.lon, s.lat); s.supplyCount = (s.supplyCount ?? 0) + 1; }
  for (const b of state.bases) if (b.scanned && rng.percent(MISSION_SCHEDULE.retaliationChanceAfterScan[state.difficulty] + 40)) { startMission(state, 'retaliation', b.region, undefined, b.id); b.scanned = false; }
  else if (!b.scanned && rng.percent(MISSION_SCHEDULE.retaliationChanceAfterScan[state.difficulty] / 2)) startMission(state, 'retaliation', b.region, undefined, b.id);
  // psi training
  for (const b of state.bases) { const slots = b.facilities.filter((f) => f.daysLeft <= 0).reduce((a, f) => a + (FACILITIES[f.def]?.psiLab ?? 0), 0); if (slots) for (const s of state.soldiers.filter((x) => x.baseId === b.id && x.psiTraining).slice(0, slots)) { s.stats.psiSkill = Math.min(100, s.stats.psiSkill + rng.int(s.stats.psiSkill === 0 ? 16 : 1, s.stats.psiSkill === 0 ? 24 : 3)); s.inPsiLabMonths = (s.inPsiLabMonths ?? 0) + 1; } }
  rng.save();
  bus.emit('month-end', report); emit(state, { type: 'month-end', text: `Monthly report: ${monthName(state.time - DAY)} — ${report.rating}`, halt: true });
  void autosave('month');
  return report;
}

// ---------- Daily / hourly ----------
function daily(state: GameState) {
  for (const r of dailyResearch(state)) toastEvent(state, 'research-done', `Research complete: ${r.name}`, { topic: r.topic, baseId: r.baseId });
  for (const b of state.bases) for (const f of b.facilities) if (f.daysLeft > 0) { f.daysLeft--; if (f.daysLeft === 0) toastEvent(state, 'facility-built', `${FACILITIES[f.def]?.name} completed at ${b.name}`, { baseId: b.id }, false); }
  for (const s of state.soldiers) if (s.wounded > 0) { s.wounded--; if (s.wounded === 0) toastEvent(state, 'soldier-healed', `${s.name} has recovered`, {}, false); }
  for (const s of [...state.sites]) if (s.expiresAt !== null && state.time >= s.expiresAt && !state.pendingMission) {
    if (s.kind === 'terror') { addScore(state, 'alien', -SCORE.terrorSiteLost, s.lon, s.lat); toastEvent(state, 'site-expired', `Terror site at ${s.city ?? 'the city'} is over. The aliens were unopposed.`, { siteId: s.id }); const u = state.ufos.find((x) => x.id === s.ufoId); if (u) removeUfo(state, u, 'left'); }
    else if (s.kind === 'landed') { const u = state.ufos.find((x) => x.id === s.ufoId); if (u && u.status === 'landed') continue; }
    if (s.kind !== 'alien-base') state.sites = state.sites.filter((x) => x.id !== s.id);
    for (const c of state.craft) if (c.dest?.kind === 'site' && c.dest.id === s.id) returnToBase(state, c.id);
  }
  for (const s of state.sites) if (s.kind === 'alien-base') addScore(state, 'alien', 2, s.lon, s.lat);
  if (state.funds < 0 && !state.gameOver) toastEvent(state, 'funds-low', 'Funds are negative. The Council will not tolerate this at month end.', {}, false);
}
function hourly(state: GameState) {
  for (const a of advanceBases(state, 1)) toastEvent(state, 'transfer-arrived', `Transfer arrived: ${a.item ? `${a.qty} ${ITEMS[a.item]?.name ?? a.item}` : a.soldierId !== undefined ? 'soldier' : 'craft'}`, { baseId: a.baseId }, false);
  for (const d of hourlyManufacture(state, 1)) toastEvent(state, 'manufacture-done', `Production complete: ${d.name} ×${d.qty}`, { baseId: d.baseId });
  for (const m of state.missions) if (!m.done && state.time >= m.nextUfoAt) spawnMissionUfo(state, m);
  state.missions = state.missions.filter((m) => !m.done || state.ufos.some((u) => u.missionId === m.id));
  for (const u of state.ufos) if (u.status === 'flying') addScore(state, 'alien', FUNDING.alienActivityPerUfoHour, u.lon, u.lat);
}

// ---------- Time ----------
export function advanceTime(state: GameState, seconds: number): GeoEventRecord[] {
  events.length = 0;
  if (state.gameOver) return [];
  let remaining = Math.max(0, Math.floor(seconds / 5) * 5);
  while (remaining > 0 && !state.paused) {
    const before = state.time; state.time += 5000; remaining -= 5;
    for (const u of [...state.ufos]) updateUfo(state, u, 5);
    for (const c of [...state.craft]) updateCraft(state, c, 5);
    const crossed = (ms: number) => Math.floor(state.time / ms) !== Math.floor(before / ms);
    if (crossed(10 * MINUTE)) tenMinuteCraft(state);
    if (crossed(30 * MINUTE)) { detectionSweep(state); thirtyMinuteCraft(state); }
    if (crossed(HOUR)) hourly(state);
    if (crossed(DAY)) daily(state);
    if (new Date(state.time).getUTCDate() === 1 && crossed(DAY)) rollMonth(state);
    if (state.gameOver) { state.paused = true; bus.emit('game-over', state.gameOver); break; }
  }
  return [...events];
}
/** Real-time driver: advances by the current compression; halts on events. */
export function tick(state: GameState, realDt: number): GeoEventRecord[] {
  if (state.paused) return [];
  const secs = COMPRESSION_SECONDS[state.compression] * Math.min(realDt, 0.25) * 4; // full step per real second at 4 Hz granularity
  return advanceTime(state, Math.max(5, Math.min(secs, 86400)));
}
export function scheduleInitialMissions(state: GameState) {
  const rng = campaignRng(state); const regions = Object.keys(REGIONS).filter((r) => REGIONS[r].cities.length > 0);
  startMission(state, 'research', rng.pick(regions)); startMission(state, rng.pick(['harvest', 'abduction', 'research']), rng.pick(regions)); startMission(state, 'terror', rng.pick(regions)).nextUfoAt = state.time + rng.int(20, 40) * DAY;
  rng.save();
}
/** Test helper: force a UFO near a point. */
export function spawnUfo(state: GameState, type: string, race: string, lon: number, lat: number, status: 'flying' | 'landed' | 'crashed' = 'flying'): Ufo {
  const rng = campaignRng(state); const m = startMission(state, 'research', regionAt(lon, lat).id, race); m.done = true;
  const traj: Ufo['trajectory'] = [{ lon: lon + 3, lat: lat + 2, altitude: 'high' }, { lon: lon + 6, lat, altitude: 'high' }, { lon: lon + 40, lat: lat + 5, altitude: 'very-high' }];
  const ufo: Ufo = { id: nextId(state), type, race, missionId: m.id, lon, lat, altitude: status === 'flying' ? 'high' : 'ground', speed: Math.round(UFOS[type].speedMax * 0.4), heading: 0, dest: status === 'flying' ? { lon: traj[0].lon, lat: traj[0].lat } : null, waypoint: 0, status, damage: status === 'crashed' ? Math.floor(UFOS[type].damageMax * 0.6) : 0, detected: status !== 'flying', hyperDetected: false, trajectory: traj };
  if (status === 'landed') ufo.landedUntil = state.time + 12 * HOUR; if (status === 'crashed') ufo.crashedUntil = state.time + 72 * HOUR;
  state.ufos.push(ufo);
  if (status !== 'flying') state.sites.push({ id: nextId(state), kind: status === 'crashed' ? 'crash' : 'landed', lon, lat, race, ufoType: type, ufoId: ufo.id, expiresAt: status === 'crashed' ? ufo.crashedUntil! : ufo.landedUntil!, detected: true, terrainSet: terrainFor(lon, lat, ufo.id), region: regionAt(lon, lat).id, createdAt: state.time });
  rng.save(); return ufo;
}
export function spawnTerror(state: GameState, lon: number, lat: number, race = 'sectoid'): Site {
  const region = regionAt(lon, lat); const site: Site = { id: nextId(state), kind: 'terror', lon, lat, race, expiresAt: state.time + 48 * HOUR, detected: true, terrainSet: 'urban', city: region.cities[0]?.name ?? 'the city', region: region.id, createdAt: state.time };
  state.sites.push(site); toastEvent(state, 'terror-site', `Terror site: ${site.city}`, { siteId: site.id }); return site;
}
export function spawnRetaliation(state: GameState, baseId: number) { const b = baseById(state, baseId); if (!b) return null; const u = spawnUfo(state, 'battleship', 'sectoid', b.lon + 1, b.lat, 'flying'); u.status = 'flying'; baseAttack(state, b, u); return u; }
export { storesOver, capacities };
