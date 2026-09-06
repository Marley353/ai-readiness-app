// Battlescape combat: ballistics, damage, explosions, grenades, reaction fire, morale, psionics, medikit/scanner, turn effects, mission end.
import type { BattleState, BattleUnit, BattleItem, Vec3, Faction, ShotKind } from './types';
import type { DamageType } from '../data/types';
import { ITEMS } from '../data/items';
import { ALIENS } from '../data/aliens';
import { VOXELS_PER_TILE as VT, VOXELS_PER_LEVEL as VL, FACING_DX, FACING_DY } from '../render/iso';
import { battleRng, tileAt, tileDefOf, unitAt, unitsOf, isOut, itemByUid, unitByUid, lineOfFire, eyeVoxel, updateAllVision, updateVision, canSee, destroyTilePart, recoverTurn, handItem, spawnItemOnGround, registerCombatHooks, stepBlocked, closeUfoDoors, type LofHit } from './engine';
import { Rng } from '../core/rng';

export interface Shot { origin: Vec3; end: Vec3; hit: LofHit; damage?: number; killed?: boolean; stunned?: boolean; targetUid?: number; explosion?: Explosion }
export interface Explosion { centre: Vec3; power: number; type: DamageType; radius: number; tiles: Vec3[]; hits: { uid: number; damage: number; killed: boolean }[] }
export interface FireResult { ok: boolean; reason?: string; shots: Shot[]; sound: string; tu: number; kind: ShotKind; shooter: number }
const SOUND: Record<string, string> = { ap: 'shot-rifle', laser: 'shot-laser', plasma: 'shot-plasma', he: 'shot-rocket', incendiary: 'shot-rocket', stun: 'shot-stun', melee: 'shot-stun' };
const log = (b: BattleState, text: string, kind: BattleState['log'][number]['kind'] = 'info') => { b.log.push({ turn: b.turn, side: b.side, text, kind }); if (b.log.length > 200) b.log.shift(); };
export const tuCostPct = (u: BattleUnit, pct: number) => Math.floor((u.stats.tu * pct) / 100);
const otherHand = (b: BattleState, u: BattleUnit, it: BattleItem) => handItem(b, u, it.slot === 'rightHand' ? 'leftHand' : 'rightHand');
export function accuracyFor(b: BattleState, u: BattleUnit, it: BattleItem, kind: ShotKind): number {
  const d = ITEMS[it.def]; const mode = kind === 'snap' ? d.snap : kind === 'aimed' ? d.aimed : kind === 'auto' ? d.auto : kind === 'melee' ? d.melee : null; if (!mode) return 0;
  let acc = (kind === 'melee' ? u.stats.melee : u.stats.firing) * mode.accuracy / 100;
  if (u.kneeling) acc *= 1.15; if (d.twoHanded && otherHand(b, u, it)) acc *= 0.8;
  acc *= 1 - Math.min(0.5, (u.wounds.leftArm + u.wounds.rightArm) * 0.1);
  return Math.floor(acc);
}
export const modeOf = (def: string, kind: ShotKind) => { const d = ITEMS[def]; return kind === 'snap' ? d.snap : kind === 'aimed' ? d.aimed : kind === 'auto' ? d.auto : kind === 'melee' ? d.melee : undefined; };
/** The original's shot deviation model (OpenXcom Projectile::applyAccuracy). */
export function applyAccuracy(rng: Rng, origin: Vec3, target: Vec3, accuracy: number): Vec3 {
  const xDist = Math.abs(origin.x - target.x), yDist = Math.abs(origin.y - target.y), zDist = Math.abs(origin.z - target.z);
  const xyShift = xDist / 2 <= yDist ? Math.floor(xDist / 4) + yDist : Math.floor((xDist + yDist) / 2);
  const zShift = xyShift <= zDist ? Math.floor(xyShift / 2) + zDist : xyShift + Math.floor(zDist / 2);
  let deviation = rng.int(0, 100) - accuracy; deviation += deviation >= 0 ? 50 : 10;
  deviation = Math.max(1, Math.floor((zShift * deviation) / 200));
  return { x: target.x + rng.int(0, deviation) - Math.floor(deviation / 2), y: target.y + rng.int(0, deviation) - Math.floor(deviation / 2), z: target.z + Math.floor(rng.int(0, Math.floor(deviation / 2)) / 2) - Math.floor(deviation / 8) };
}
export const sideHit = (target: BattleUnit, from: Vec3): keyof BattleUnit['armour'] => { const dx = from.x - target.pos.x, dy = from.y - target.pos.y; if (!dx && !dy) return 'front'; const ang = Math.atan2(dy, dx); const facingAng = Math.atan2(FACING_DY[target.facing], FACING_DX[target.facing]); let d = Math.abs(((ang - facingAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < Math.PI / 4) return 'front'; if (d > (3 * Math.PI) / 4) return 'rear'; const cross = FACING_DX[target.facing] * dy - FACING_DY[target.facing] * dx; return cross > 0 ? 'right' : 'left'; };
const woundable = (u: BattleUnit) => !u.hwp && u.size === 1 && !(u.race && ['cyberdisc', 'sectopod', 'silacoid', 'celatid', 'zombie'].includes(u.race));
export interface DamageResult { damage: number; killed: boolean; stunned: boolean; wounds: number }
const leadership = (b: BattleState, faction: Faction) => { if (faction !== 'xcom') return 100; let best = 0; for (const u of unitsOf(b, 'xcom')) { const r = ['rookie', 'squaddie', 'sergeant', 'captain', 'colonel', 'commander'].indexOf(String(u.rank)); best = Math.max(best, r); } return 100 + [0, 0, 10, 15, 25, 50][best]; };
const rankModifier = (u: BattleUnit) => { const r = String(u.rank ?? 'soldier'); return ({ rookie: 100, squaddie: 110, sergeant: 125, captain: 150, colonel: 200, commander: 300, soldier: 100, navigator: 110, medic: 110, engineer: 120, leader: 200, terrorist: 100 } as Record<string, number>)[r] ?? 100; };
export function applyDamage(b: BattleState, u: BattleUnit, power: number, type: DamageType, side: keyof BattleUnit['armour'] | 'none', source?: BattleUnit, rolled = true): DamageResult {
  const { rng, save } = battleRng(b); const res: DamageResult = { damage: 0, killed: false, stunned: false, wounds: 0 };
  if (isOut(u) && u.status === 'dead') { save(); return res; }
  let dmg = rolled ? Math.floor((power * rng.int(0, 200)) / 100) : power;
  const mod = u.damageMod[type]; if (mod !== undefined) dmg = Math.floor(dmg * mod);
  if (side !== 'none') { const armour = u.armour[side]; const after = Math.max(0, dmg - armour); u.armour[side] = Math.max(0, armour - Math.floor(after / 10)); dmg = after; }
  if (type === 'stun') { u.stun += dmg; res.damage = dmg; }
  else if (type === 'smoke') { u.stun += dmg; res.damage = dmg; }
  else if (dmg > 0) {
    u.health -= dmg; res.damage = dmg; if (type !== 'incendiary') u.stun += Math.floor(dmg / 4);
    if (woundable(u) && u.health > 0 && rng.int(0, 10) < dmg) { const n = rng.int(1, 3); const part = rng.pick(['torso', 'torso', 'head', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as const); u.wounds[part] += n; res.wounds = n; }
    const bravery = Math.floor((110 - u.stats.bravery) / 10); const modifier = u.faction === 'xcom' ? leadership(b, 'xcom') : 100; u.morale = Math.max(0, u.morale - Math.floor((100 * Math.floor((dmg * bravery) / 10)) / modifier));
    if (type === 'incendiary' && !u.hwp) u.fire = Math.max(u.fire, rng.int(1, 3));
  }
  if (u.health <= 0) { kill(b, u, source, type); res.killed = true; }
  else if (u.stun >= u.health && u.status !== 'unconscious') { u.status = 'unconscious'; u.kneeling = false; res.stunned = true; dropAll(b, u); log(b, `${u.name} falls unconscious`, 'hit'); if (u.faction === 'alien') b.tally.alienStunned++; if (u.faction === 'xcom') b.tally.xcomStunned++; }
  save(); return res;
}
function dropAll(b: BattleState, u: BattleUnit) { for (const id of [...u.items]) { const it = itemByUid(b, id); if (it) { it.owner = undefined; it.slot = 'ground'; it.tile = { ...u.pos }; } } u.items = []; }
export function kill(b: BattleState, u: BattleUnit, killer?: BattleUnit, type?: DamageType) {
  if (u.status === 'dead') return; u.status = 'dead'; u.health = Math.min(0, u.health); u.kneeling = false; dropAll(b, u);
  const corpse = u.hwp ? null : u.faction === 'civilian' ? 'civilian-corpse' : u.race ? (ALIENS[u.race]?.ranks as Record<string, { corpseItem: string } | undefined>)[String(u.rank ?? 'soldier')]?.corpseItem ?? `${u.race}-corpse` : null;
  if (u.faction === 'xcom' && !u.hwp) spawnItemOnGround(b, 'corpse', u.pos); else if (corpse && ITEMS[corpse]) spawnItemOnGround(b, corpse, u.pos);
  log(b, `${u.name} ${type === 'stun' ? 'has died' : 'is killed'}`, 'kill');
  if (u.faction === 'alien') { b.tally.alienKilled++; if (killer?.faction === 'xcom') killer.kills++; } else if (u.faction === 'xcom') b.tally.xcomDead++; else if (u.faction === 'civilian') { if (killer?.faction === 'xcom') b.tally.civKilledXcom++; else b.tally.civKilledAlien++; }
  // morale
  const { rng, save } = battleRng(b); const modifier = rankModifier(u); const loserMod = leadership(b, u.originalFaction); const winnerMod = leadership(b, u.originalFaction === 'alien' ? 'xcom' : 'alien');
  for (const o of b.units) { if (isOut(o) || o.size === 2 || o.hwp) continue; if (o.originalFaction === u.originalFaction || (u.faction === 'civilian' && o.faction === 'xcom')) { const bravery = Math.floor((110 - o.stats.bravery) / 10); o.morale = Math.max(0, o.morale - Math.floor((modifier * 200 * bravery) / loserMod / 100)); } else if (u.faction !== 'civilian') o.morale = Math.min(100, o.morale + Math.floor((10 * winnerMod) / 100)); }
  if (killer && killer.faction !== u.faction) killer.morale = Math.min(100, killer.morale + 20);
  // special deaths
  if (u.race === 'zombie') { const c = spawnAlienAt(b, 'chryssalid', u.pos, rng); if (c) log(b, 'A Chryssalid bursts from the zombie', 'kill'); }
  if (u.race === 'cyberdisc') { save(); explode(b, u.pos, 120, 'he', 4, u); return; }
  if (u.race === 'silacoid') { const t = tileAt(b, u.pos.x, u.pos.y, u.pos.z); if (t) t.fire = Math.max(t.fire, 3); }
  save();
}
export function spawnAlienAt(b: BattleState, race: string, pos: Vec3, rng: Rng): BattleUnit | null {
  const rd = ALIENS[race]; const rk = rd?.ranks.terrorist ?? rd?.ranks.soldier; if (!rd || !rk) return null;
  const u: BattleUnit = { uid: b.nextUid++, name: rd.name, faction: 'alien', originalFaction: 'alien', race, rank: 'terrorist', pos: { ...pos }, facing: rng.int(0, 7) as any, size: 1, stats: { ...rk.stats }, tu: rk.stats.tu, energy: rk.stats.stamina, health: rk.stats.health, morale: 100, stun: 0, status: 'standing', kneeling: false, flying: !!rd.flying, armour: { ...rk.armour }, damageMod: { ...rd.damageMod }, wounds: { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 }, fire: 0, items: [], visibleTo: [], visibleUnits: [], spotted: true, turnsSinceSeen: 0, kills: 0, exp: { firing: 0, throwing: 0, melee: 0, reactions: 0, psiSkill: 0, bravery: 0 }, standHeight: rk.standHeight, kneelHeight: rk.kneelHeight, unitSprite: rk.unitSprite, aiState: { aggression: 2, intelligence: 2 } };
  b.units.push(u); return u;
}
export function zombify(b: BattleState, victim: BattleUnit, attacker: BattleUnit) {
  const { rng, save } = battleRng(b); const pos = { ...victim.pos }; victim.health = 0; victim.status = 'dead'; dropAll(b, victim); log(b, `${victim.name} is turned into a zombie`, 'kill'); if (victim.faction === 'xcom') b.tally.xcomDead++;
  const z = spawnAlienAt(b, 'zombie', pos, rng); if (z) z.spawnedFrom = attacker.uid; save();
}

// ---------- Firing ----------
export function fire(b: BattleState, u: BattleUnit, kind: ShotKind, target: Vec3, itemUid?: number): FireResult {
  const it = itemUid ? itemByUid(b, itemUid) : handItem(b, u, 'rightHand') ?? handItem(b, u, 'leftHand');
  const fail = (reason: string): FireResult => ({ ok: false, reason, shots: [], sound: '', tu: 0, kind, shooter: u.uid });
  if (!it) return fail('NO WEAPON'); const d = ITEMS[it.def]; const mode = modeOf(it.def, kind); if (!mode) return fail('MODE NOT AVAILABLE');
  if (isOut(u) || u.status === 'panicking') return fail('UNIT CANNOT ACT');
  const cost = tuCostPct(u, mode.tu); if (u.tu < cost) return fail('NOT ENOUGH TIME UNITS');
  if (kind !== 'melee') { if (d.ammo?.length) { if (!it.ammo || it.rounds <= 0) return fail('NO AMMUNITION'); } }
  const ammoDef = it.ammo ? ITEMS[it.ammo] : d; const power = ammoDef.damage ?? 0, type = ammoDef.damageType ?? 'ap';
  const { rng, save } = battleRng(b); u.tu -= cost;
  const acc = accuracyFor(b, u, it, kind); const shots: Shot[] = []; const n = kind === 'auto' ? mode.shots ?? 3 : 1;
  const origin = eyeVoxel(u); const targetV = { x: target.x * VT + VT / 2, y: target.y * VT + VT / 2, z: target.z * VL + 10 };
  const tu0 = unitAt(b, target.x, target.y, target.z); if (tu0) { targetV.z = target.z * VL + Math.floor((tu0.kneeling ? tu0.kneelHeight : tu0.standHeight) / 2); }
  if (kind === 'melee') {
    const t = unitAt(b, target.x, target.y, target.z); const dist = Math.max(Math.abs(target.x - u.pos.x), Math.abs(target.y - u.pos.y)); if (!t || dist > 1 || target.z !== u.pos.z) { u.tu += cost; save(); return fail('NO TARGET IN REACH'); }
    const hitRoll = rng.percent(acc); const shot: Shot = { origin, end: targetV, hit: { kind: hitRoll ? 'unit' : 'none', pos: targetV, unit: hitRoll ? t : undefined }, targetUid: t.uid };
    if (hitRoll) { if (u.race === 'chryssalid' && !t.hwp && t.faction !== 'alien') { zombify(b, t, u); shot.killed = true; } else { const r = applyDamage(b, t, power, type, sideHit(t, u.pos), u); shot.damage = r.damage; shot.killed = r.killed; shot.stunned = r.stunned; if (r.damage > 0) u.exp.melee++; } }
    shots.push(shot); save(); b.tally.shotsFired++; if (hitRoll) b.tally.hits++; return { ok: true, shots, sound: it.def === 'stun-rod' ? 'shot-stun' : 'hit-flesh', tu: cost, kind, shooter: u.uid };
  }
  let expGiven = false;
  for (let i = 0; i < n; i++) {
    if (d.ammo?.length) { if (it.rounds <= 0) break; it.rounds--; if (it.rounds === 0 && it.ammo && ITEMS[it.ammo]?.clipSize === 1) { it.ammo = undefined; } }
    b.tally.shotsFired++;
    const aimed = applyAccuracy(rng, origin, targetV, acc);
    const far = { x: origin.x + (aimed.x - origin.x) * 40, y: origin.y + (aimed.y - origin.y) * 40, z: origin.z + (aimed.z - origin.z) * 40 };
    const hit = lineOfFire(b, origin, far, u);
    const shot: Shot = { origin, end: hit.kind === 'none' ? far : hit.pos, hit };
    if (ammoDef.blastRadius && (type === 'he' || type === 'incendiary' || type === 'stun' || type === 'smoke')) { const c = hit.tile ?? { x: Math.floor(shot.end.x / VT), y: Math.floor(shot.end.y / VT), z: Math.floor(shot.end.z / VL) }; save(); shot.explosion = explode(b, c, power, type, ammoDef.blastRadius, u); if (shot.explosion.hits.some((h) => h.damage > 0) && !expGiven) { u.exp.firing++; expGiven = true; } shots.push(shot); continue; }
    if (hit.kind === 'unit' && hit.unit) { const t = hit.unit; const r = applyDamage(b, t, power, type, sideHit(t, u.pos), u); shot.damage = r.damage; shot.killed = r.killed; shot.stunned = r.stunned; shot.targetUid = t.uid; b.tally.hits++; if (!expGiven && t.faction !== u.faction) { u.exp.firing++; expGiven = true; } }
    else if ((hit.kind === 'wall' || hit.kind === 'object' || hit.kind === 'floor') && hit.tile && hit.part) { const t = tileAt(b, hit.tile.x, hit.tile.y, hit.tile.z); const def = t ? tileDefOf(b, hit.part === 'floor' ? t.floor : t[hit.part]) : undefined; const dmg = Math.floor((power * rng.int(0, 200)) / 100); if (def && dmg >= def.armour && type !== 'stun' && type !== 'smoke') { if (def.explosive) { destroyTilePart(b, hit.tile, hit.part); save(); explode(b, hit.tile, def.explosive, 'he', 4, u); } else destroyTilePart(b, hit.tile, hit.part); } }
    shots.push(shot);
  }
  save(); updateVision(b, u);
  return { ok: true, shots, sound: SOUND[type] ?? 'shot-rifle', tu: cost, kind, shooter: u.uid };
}

// ---------- Explosions / effects ----------
export function explode(b: BattleState, centre: Vec3, power: number, type: DamageType, radius: number, source?: BattleUnit): Explosion {
  const { rng, save } = battleRng(b); const ex: Explosion = { centre: { ...centre }, power, type, radius, tiles: [], hits: [] };
  const seen = new Map<number, number>(); const key = (p: Vec3) => (p.z * b.map.h + p.y) * b.map.w + p.x;
  const frontier: { p: Vec3; pw: number }[] = [{ p: centre, pw: power }]; seen.set(key(centre), power);
  const chain: { p: Vec3; power: number }[] = [];
  while (frontier.length) {
    const { p, pw } = frontier.shift()!; const t = tileAt(b, p.x, p.y, p.z); if (!t) continue; ex.tiles.push(p);
    const dist = Math.max(Math.abs(p.x - centre.x), Math.abs(p.y - centre.y));
    if (type === 'he' || type === 'incendiary') {
      for (const part of ['object', 'wallN', 'wallW'] as const) { const def = tileDefOf(b, t[part]); if (def && pw >= def.armour) { if (def.explosive) chain.push({ p, power: def.explosive }); destroyTilePart(b, p, part); } }
      if (type === 'he' && pw > 50) t.smoke = Math.max(t.smoke, rng.int(2, 4));
      if (type === 'incendiary') { const fd = tileDefOf(b, t.floor); const fl = Math.max(fd?.flammability ?? 20, 20); if (rng.percent(Math.min(100, fl + 40))) t.fire = Math.max(t.fire, rng.int(2, 4)); }
    } else if (type === 'smoke') t.smoke = Math.max(t.smoke, rng.int(6, 12)); else if (type === 'stun') t.stunGas = Math.max(t.stunGas ?? 0, rng.int(3, 6));
    const victims = b.units.filter((v) => !isOut(v) && v.pos.z === p.z && p.x >= v.pos.x && p.x < v.pos.x + v.size && p.y >= v.pos.y && p.y < v.pos.y + v.size);
    for (const v of victims) { if (ex.hits.some((h) => h.uid === v.uid)) continue; if (type === 'smoke') continue; const dmg = type === 'stun' ? Math.floor((pw * rng.int(50, 150)) / 100) : Math.floor((pw * rng.int(50, 150)) / 100); const r = applyDamage(b, v, dmg, type, dist === 0 ? 'under' : sideHit(v, centre), source, false); ex.hits.push({ uid: v.uid, damage: r.damage, killed: r.killed }); }
    const next = pw - 10; if (next <= 0 || dist >= radius) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const np = { x: p.x + dx, y: p.y + dy, z: p.z }; const nt = tileAt(b, np.x, np.y, np.z); if (!nt) continue; const k = key(np); let blockPw = next; const wall = dy === -1 ? t.wallN : dy === 1 ? nt.wallN : dx === -1 ? t.wallW : nt.wallW; if (wall) { const wd = tileDefOf(b, wall); if (wd && !(wd.door && t.doorOpen)) { blockPw = next - wd.armour; } } if (blockPw <= 0) continue; if ((seen.get(k) ?? -1) >= blockPw) continue; seen.set(k, blockPw); frontier.push({ p: np, pw: blockPw }); }
  }
  save();
  for (const c of chain) { const sub = explode(b, c.p, c.power, 'he', 4, source); ex.hits.push(...sub.hits.filter((h) => !ex.hits.some((x) => x.uid === h.uid))); }
  updateAllVision(b);
  log(b, `Explosion (${power})`, 'info');
  return ex;
}
export function checkProximity(b: BattleState, u: BattleUnit, pos: Vec3): boolean {
  let fired = false;
  for (const it of [...b.items]) { if (it.def !== 'proximity-grenade' || it.primed === undefined || it.primed < 0 || !it.tile) continue; if (Math.abs(it.tile.x - pos.x) <= 1 && Math.abs(it.tile.y - pos.y) <= 1 && it.tile.z === pos.z && it.owner === undefined) { const d = ITEMS[it.def]; b.items = b.items.filter((x) => x.uid !== it.uid); explode(b, it.tile, d.damage ?? 70, 'he', d.blastRadius ?? 3); fired = true; } }
  return fired;
}
export function primeGrenade(b: BattleState, u: BattleUnit, itemUid: number, turns: number): { ok: boolean; reason?: string } {
  const it = itemByUid(b, itemUid); if (!it || it.owner !== u.uid) return { ok: false, reason: 'NO ITEM' }; const d = ITEMS[it.def]; if (d.battleType !== 'grenade' && d.battleType !== 'proximity') return { ok: false, reason: 'NOT A GRENADE' };
  const cost = tuCostPct(u, d.primeTu ?? 50); if (u.tu < cost) return { ok: false, reason: 'NOT ENOUGH TIME UNITS' }; u.tu -= cost; it.primed = Math.max(0, turns); return { ok: true };
}
export function unprimeGrenade(b: BattleState, u: BattleUnit, itemUid: number) { const it = itemByUid(b, itemUid); if (it && it.owner === u.uid) it.primed = undefined; }
export const throwRange = (u: BattleUnit, weight: number) => Math.max(1, Math.floor((2.5 * u.stats.strength) / Math.max(1, weight)));
export function throwItem(b: BattleState, u: BattleUnit, itemUid: number, target: Vec3): FireResult & { landed?: Vec3 } {
  const it = itemByUid(b, itemUid); const fail = (reason: string): FireResult => ({ ok: false, reason, shots: [], sound: '', tu: 0, kind: 'throw', shooter: u.uid });
  if (!it || it.owner !== u.uid) return fail('NO ITEM'); const d = ITEMS[it.def]; const cost = tuCostPct(u, d.throwTu ?? 25); if (u.tu < cost) return fail('NOT ENOUGH TIME UNITS');
  const dist = Math.max(Math.abs(target.x - u.pos.x), Math.abs(target.y - u.pos.y)); if (dist > throwRange(u, d.weight)) return fail('OUT OF RANGE');
  const { rng, save } = battleRng(b); u.tu -= cost;
  const acc = u.stats.throwing; const dev = rng.int(0, 100) > acc ? rng.int(1, Math.max(1, Math.floor(dist / 3))) : 0;
  let land = { x: target.x + (dev ? rng.int(-dev, dev) : 0), y: target.y + (dev ? rng.int(-dev, dev) : 0), z: target.z };
  if (!tileAt(b, land.x, land.y, land.z)) land = { ...target };
  it.owner = undefined; it.slot = 'ground'; it.tile = land; u.items = u.items.filter((id) => id !== it.uid);
  if (it.def === 'electro-flare') it.fuse = 1;
  if (d.battleType === 'grenade' && it.primed === 0) { b.items = b.items.filter((x) => x.uid !== it.uid); const ex = explode(b, land, d.damage ?? 50, d.damageType ?? 'he', d.blastRadius ?? 2, u); if (ex.hits.some((h) => h.damage > 0)) u.exp.throwing++; save(); updateAllVision(b); return { ok: true, shots: [{ origin: eyeVoxel(u), end: { x: land.x * VT + 8, y: land.y * VT + 8, z: land.z * VL }, hit: { kind: 'none', pos: land }, explosion: ex }], sound: 'throw', tu: cost, kind: 'throw', shooter: u.uid, landed: land }; }
  u.exp.throwing += dev === 0 ? 1 : 0; save(); updateAllVision(b);
  return { ok: true, shots: [{ origin: eyeVoxel(u), end: { x: land.x * VT + 8, y: land.y * VT + 8, z: land.z * VL }, hit: { kind: 'none', pos: land } }], sound: 'throw', tu: cost, kind: 'throw', shooter: u.uid, landed: land };
}
export function launch(b: BattleState, u: BattleUnit, waypoints: Vec3[]): FireResult {
  const it = handItem(b, u, 'rightHand') ?? handItem(b, u, 'leftHand'); const fail = (reason: string): FireResult => ({ ok: false, reason, shots: [], sound: '', tu: 0, kind: 'launch', shooter: u.uid });
  if (!it || !ITEMS[it.def].guided) return fail('NO LAUNCHER'); if (!it.ammo || it.rounds <= 0) return fail('NO AMMUNITION'); if (waypoints.length < 1 || waypoints.length > 8) return fail('1 TO 8 WAYPOINTS');
  const mode = ITEMS[it.def].aimed!; const cost = tuCostPct(u, mode.tu); if (u.tu < cost) return fail('NOT ENOUGH TIME UNITS'); u.tu -= cost; it.rounds--; if (it.rounds === 0) it.ammo = undefined;
  const ammo = ITEMS['blaster-bomb'].id === it.ammo || it.ammo === undefined ? ITEMS['blaster-bomb'] : ITEMS[it.ammo]; const power = ammo.damage ?? 200;
  let from = eyeVoxel(u); const shots: Shot[] = []; let boom: Vec3 | null = null;
  for (const w of waypoints) { const to = { x: w.x * VT + 8, y: w.y * VT + 8, z: w.z * VL + 10 }; const hit = lineOfFire(b, from, to, u); shots.push({ origin: from, end: hit.kind === 'none' ? to : hit.pos, hit }); if (hit.kind !== 'none') { boom = hit.tile ?? w; break; } from = to; boom = w; }
  const ex = explode(b, boom ?? waypoints[waypoints.length - 1], power, 'he', ammo.blastRadius ?? 8, u); shots[shots.length - 1].explosion = ex; if (ex.hits.some((h) => h.damage > 0)) u.exp.firing++;
  return { ok: true, shots, sound: 'shot-blaster', tu: cost, kind: 'launch', shooter: u.uid };
}

// ---------- Reaction fire ----------
export const reactionScore = (u: BattleUnit) => u.stats.reactions * (u.tu / Math.max(1, u.stats.tu));
export function reactionCheck(b: BattleState, mover: BattleUnit): FireResult[] {
  const results: FireResult[] = []; if (isOut(mover)) return results;
  for (let round = 0; round < 10; round++) {
    const moverScore = reactionScore(mover);
    const candidates = b.units.filter((c) => c !== mover && !isOut(c) && c.faction !== mover.faction && c.faction !== 'civilian' && mover.faction !== 'civilian' && c.status !== 'panicking' && reactionScore(c) > moverScore && canSee(b, c, mover)).sort((a, c) => reactionScore(c) - reactionScore(a));
    let fired = false;
    for (const c of candidates) {
      const w = handItem(b, c, 'rightHand') ?? handItem(b, c, 'leftHand'); if (!w) continue; const d = ITEMS[w.def]; const snap = d.snap ? 'snap' : d.melee ? 'melee' : d.aimed ? 'aimed' : null; if (!snap) continue; if (snap === 'melee' && Math.max(Math.abs(c.pos.x - mover.pos.x), Math.abs(c.pos.y - mover.pos.y)) > 1) continue;
      const cost = tuCostPct(c, modeOf(w.def, snap)!.tu); const reserve = c.reserve === 'aimed' ? tuCostPct(c, d.aimed?.tu ?? 0) : c.reserve === 'auto' ? tuCostPct(c, d.auto?.tu ?? 0) : 0; if (c.tu < cost || (c.faction === 'xcom' && c.tu - cost < reserve && c.reserve !== 'none' && c.reserve !== 'snap')) continue;
      const lof = lineOfFire(b, eyeVoxel(c), { x: mover.pos.x * VT + 8, y: mover.pos.y * VT + 8, z: mover.pos.z * VL + 10 }, c); if (lof.kind !== 'unit' || lof.unit !== mover) continue;
      const r = fire(b, c, snap, mover.pos, w.uid); if (!r.ok) continue; c.exp.reactions++; (r as any).reaction = true; (r as any).target = mover.uid; results.push(r); fired = true; log(b, `${c.name} reaction fire at ${mover.name}`, 'hit'); break;
    }
    if (!fired || isOut(mover)) break;
  }
  return results;
}

// ---------- Psionics ----------
export function psiAttack(b: BattleState, attacker: BattleUnit, target: BattleUnit, kind: 'panic' | 'control', viaAmp = false): { ok: boolean; success: boolean; reason?: string } {
  if (attacker.stats.psiSkill <= 0) return { ok: false, success: false, reason: 'NO PSI SKILL' };
  const cost = viaAmp ? tuCostPct(attacker, 25) : Math.floor(attacker.stats.tu * 0.25); if (attacker.tu < cost) return { ok: false, success: false, reason: 'NOT ENOUGH TIME UNITS' }; attacker.tu -= cost;
  const { rng, save } = battleRng(b);
  const dist = Math.sqrt((attacker.pos.x - target.pos.x) ** 2 + (attacker.pos.y - target.pos.y) ** 2);
  let attack = (attacker.stats.psiStrength * attacker.stats.psiSkill) / 50 - dist / 2 + (kind === 'panic' ? 45 : 25) + rng.int(0, 55);
  const defence = target.stats.psiStrength + target.stats.psiSkill / 5;
  const success = attack > defence; attacker.psiAttackedThisTurn = (attacker.psiAttackedThisTurn ?? 0) + 1;
  if (success) { attacker.exp.psiSkill++; if (kind === 'panic') { target.morale = Math.max(0, target.morale - 100 + Math.floor(target.stats.bravery / 2)); log(b, `${target.name} is panicked by a psionic attack`, 'psi'); } else { target.faction = attacker.faction; target.mindControlled = true; target.visibleUnits = []; log(b, `${target.name} is under alien control`, 'psi'); if (attacker.faction === 'xcom') target.spotted = true; } }
  else log(b, `${target.name} resists a psionic attack`, 'psi');
  save(); updateAllVision(b); return { ok: true, success };
}

// ---------- Equipment ----------
export function useMedikit(b: BattleState, u: BattleUnit, target: BattleUnit, mode: 'heal' | 'stimulant' | 'painkiller', part: keyof BattleUnit['wounds'] = 'torso'): { ok: boolean; reason?: string } {
  const kit = u.items.map((id) => itemByUid(b, id)!).find((i) => i.def === 'medi-kit'); if (!kit) return { ok: false, reason: 'NO MEDI-KIT' }; const m = ITEMS['medi-kit'].medikit!;
  if (Math.max(Math.abs(u.pos.x - target.pos.x), Math.abs(u.pos.y - target.pos.y)) > 1) return { ok: false, reason: 'TARGET NOT ADJACENT' };
  const tu = mode === 'heal' ? m.healTu : mode === 'stimulant' ? m.stimTu : m.painTu; if (u.tu < tu) return { ok: false, reason: 'NOT ENOUGH TIME UNITS' };
  const charges = ((kit as any).charges ??= { heal: m.heal, stimulant: m.stimulant, painkiller: m.painkiller }); if (charges[mode] <= 0) return { ok: false, reason: 'NO CHARGES LEFT' }; charges[mode]--; u.tu -= tu;
  if (mode === 'heal') { const p = target.wounds[part] > 0 ? part : (Object.keys(target.wounds) as (keyof BattleUnit['wounds'])[]).find((k) => target.wounds[k] > 0); if (p) target.wounds[p]--; target.health = Math.min(target.stats.health, target.health + m.healAmount); }
  else if (mode === 'stimulant') { target.energy = Math.min(target.stats.stamina, target.energy + m.stimAmount); target.stun = Math.max(0, target.stun - 4); if (target.status === 'unconscious' && target.stun < target.health) target.status = 'standing'; }
  else target.morale = Math.min(100, target.morale + Math.min(m.painAmount, target.stats.health - target.health));
  return { ok: true };
}
export function useScanner(b: BattleState, u: BattleUnit): { ok: boolean; reason?: string; blips: { x: number; y: number; z: number; size: number }[] } {
  const sc = u.items.map((id) => itemByUid(b, id)!).find((i) => i.def === 'motion-scanner'); if (!sc) return { ok: false, reason: 'NO SCANNER', blips: [] }; const cost = tuCostPct(u, ITEMS['motion-scanner'].useTu ?? 25); if (u.tu < cost) return { ok: false, reason: 'NOT ENOUGH TIME UNITS', blips: [] }; u.tu -= cost;
  const blips = b.units.filter((o) => o !== u && !isOut(o) && (o.movedThisTurn ?? 0) > 0 && Math.abs(o.pos.x - u.pos.x) <= 9 && Math.abs(o.pos.y - u.pos.y) <= 9).map((o) => ({ x: o.pos.x, y: o.pos.y, z: o.pos.z, size: Math.min(3, Math.ceil((o.movedThisTurn ?? 1) / 3)) }));
  return { ok: true, blips };
}

// ---------- Turn effects ----------
export function endOfTurn(b: BattleState, side: Faction) {
  const { rng, save } = battleRng(b);
  // primed grenades tick at the end of the X-COM turn (all timers count whole turns)
  if (side === 'xcom') for (const it of [...b.items]) { if (it.primed === undefined || it.primed < 0) continue; const d = ITEMS[it.def]; if (d.battleType === 'proximity') continue; if (it.primed > 0) { it.primed--; continue; } const at = it.tile ?? unitByUid(b, it.owner ?? -1)?.pos; if (!at) continue; b.items = b.items.filter((x) => x.uid !== it.uid); if (it.owner !== undefined) { const o = unitByUid(b, it.owner); if (o) o.items = o.items.filter((id) => id !== it.uid); } explode(b, at, d.damage ?? 50, d.damageType ?? 'he', d.blastRadius ?? 2); }
  if (side === 'xcom') {
    b.map.tiles.forEach((t, i) => { const x = i % b.map.w, y = Math.floor(i / b.map.w) % b.map.h, z = Math.floor(i / (b.map.w * b.map.h));
      if (t.fire > 0) { t.fire--; const u = unitAt(b, x, y, z); if (u && !u.flying) { applyDamage(b, u, rng.int(5, 15), 'incendiary', 'under', undefined, false); } for (const it of b.items) if (it.tile && it.tile.x === x && it.tile.y === y && it.tile.z === z && ITEMS[it.def].category === 'corpse') { /* corpses burn */ } if (t.fire === 0) { t.smoke = Math.max(t.smoke, 2); } else if (rng.percent(20)) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = tileAt(b, x + dx, y + dy, z); if (n && n.fire === 0 && !n.wallN) { const fd = tileDefOf(b, n.floor); const od = tileDefOf(b, n.object); const fl = Math.max(fd?.flammability ?? 0, od?.flammability ?? 0); if (fl > 0 && rng.percent(fl)) n.fire = rng.int(1, 3); } } } }
      if (t.smoke > 0) { t.smoke--; const u = unitAt(b, x, y, z); if (u && !u.hwp && !(u.race && ['cyberdisc', 'sectopod'].includes(u.race))) applyDamage(b, u, 2, 'smoke', 'none', undefined, false); }
      if ((t.stunGas ?? 0) > 0) { t.stunGas!--; const u = unitAt(b, x, y, z); if (u) applyDamage(b, u, 6, 'stun', 'none', undefined, false); }
    });
    for (const it of b.items) if (it.def === 'electro-flare' && it.tile && it.fuse !== undefined) { /* flares burn all mission */ }
  }
  for (const u of b.units) { if (u.faction === side) { u.movedThisTurn = 0; u.psiAttackedThisTurn = 0; } }
  save();
}
export interface TurnEvent { kind: 'panic' | 'berserk' | 'bleeding' | 'died' | 'woke' | 'burning' | 'mc-ended'; uid: number; text: string }
export function startOfTurn(b: BattleState, side: Faction): TurnEvent[] {
  const { rng, save } = battleRng(b); const events: TurnEvent[] = [];
  for (const u of b.units) {
    if (u.status === 'dead') continue;
    if (u.originalFaction === side && u.mindControlled && u.faction !== side) { u.faction = u.originalFaction; u.mindControlled = false; events.push({ kind: 'mc-ended', uid: u.uid, text: `${u.name} regains control` }); }
    if (u.faction !== side) continue;
    u.aiDone = false;
    if (u.status === 'panicking' || u.status === 'berserk') u.status = 'standing';
    recoverTurn(b, u);
    const wounds = Object.values(u.wounds).reduce((a, c) => a + c, 0);
    if (wounds > 0 && u.status !== 'unconscious') { u.health -= wounds; events.push({ kind: 'bleeding', uid: u.uid, text: `${u.name} is bleeding` }); if (u.health <= 0) { kill(b, u, undefined, 'none'); events.push({ kind: 'died', uid: u.uid, text: `${u.name} has died of wounds` }); continue; } }
    if (u.fire > 0) { u.fire--; const fr = applyDamage(b, u, rng.int(5, 10), 'incendiary', 'none', undefined, false); events.push({ kind: 'burning', uid: u.uid, text: `${u.name} is burning` }); if (fr.killed) continue; }
    if (u.stun > 0) u.stun = Math.max(0, u.stun - 1);
    if (u.status === 'unconscious' && u.stun < u.health) { u.status = 'standing'; u.tu = 0; events.push({ kind: 'woke', uid: u.uid, text: `${u.name} has regained consciousness` }); continue; }
    if (u.status === 'unconscious') continue;
    const chance = 100 - 2 * u.morale;
    if (chance > 0) { if (rng.int(1, 100) <= chance) { const berserk = rng.int(0, 100) <= 33; u.status = berserk ? 'berserk' : 'panicking'; if (!berserk) { u.tu = 0; if (rng.percent(50)) { const w = handItem(b, u, 'rightHand'); if (w) { w.owner = undefined; w.slot = 'ground'; w.tile = { ...u.pos }; u.items = u.items.filter((id) => id !== w.uid); } } } u.morale = Math.min(100, u.morale + 15); events.push({ kind: berserk ? 'berserk' : 'panic', uid: u.uid, text: `${u.name} ${berserk ? 'has gone berserk' : 'is panicking'}` }); log(b, events[events.length - 1].text, 'panic'); } else u.exp.bravery++; }
  }
  save();
  // berserk units fire wildly
  for (const u of b.units) if (u.faction === side && u.status === 'berserk') { const w = handItem(b, u, 'rightHand') ?? handItem(b, u, 'leftHand'); for (let i = 0; i < 4 && w && u.tu > 0; i++) { const tgt = b.units.filter((o) => o !== u && !isOut(o) && canSee(b, u, o)); const t = tgt.length ? rng.pick(tgt).pos : { x: Math.max(0, Math.min(b.map.w - 1, u.pos.x + rng.int(-5, 5))), y: Math.max(0, Math.min(b.map.h - 1, u.pos.y + rng.int(-5, 5))), z: u.pos.z }; const kind: ShotKind = ITEMS[w.def].auto ? 'auto' : ITEMS[w.def].snap ? 'snap' : 'aimed'; const r = fire(b, u, kind, t, w.uid); if (!r.ok) break; } u.tu = 0; }
  save(); return events;
}
registerCombatHooks({ reactionCheck, checkProximity, startOfTurn, endOfTurn });

// ---------- Missions ----------
export function checkMissionEnd(b: BattleState): BattleState['ended'] {
  if (b.ended) return b.ended;
  const aliens = unitsOf(b, 'alien').filter((u) => !isOut(u) && u.originalFaction === 'alien'); const xcom = b.units.filter((u) => u.originalFaction === 'xcom' && !isOut(u));
  if (!xcom.length) { b.ended = { winner: 'alien', reason: b.setup.missionType === 'base-defence' ? 'The base has fallen' : 'All X-COM units lost' }; return b.ended; }
  if (b.setup.missionType === 'cydonia-brain') { const brainLeft = b.map.tiles.some((t) => t.object === 'brain'); if (!brainLeft) { b.ended = { winner: 'xcom', reason: 'The alien brain is destroyed' }; b.missionObjectiveDone = true; return b.ended; } return null; }
  if (!aliens.length) { b.ended = { winner: 'xcom', reason: b.setup.missionType === 'cydonia-surface' ? 'Surface secured' : 'All aliens neutralised' }; if (b.setup.missionType === 'alien-base') b.missionObjectiveDone = true; return b.ended; }
  return null;
}
export function abortMission(b: BattleState): BattleState['ended'] {
  const fp = b.map.craftFootprint;
  for (const u of b.units) if (u.originalFaction === 'xcom' && !isOut(u)) { const inside = fp ? u.pos.x >= fp.x && u.pos.x < fp.x + fp.w && u.pos.y >= fp.y && u.pos.y < fp.y + fp.h : b.setup.missionType === 'base-defence' ? true : u.pos.x === 0 || u.pos.y === 0 || u.pos.x === b.map.w - 1 || u.pos.y === b.map.h - 1; if (!inside) { u.status = 'dead'; b.tally.xcomDead++; } }
  b.ended = { winner: 'abort', reason: 'Mission aborted' }; return b.ended;
}
export const missionTally = (b: BattleState) => ({ ...b.tally, civSaved: unitsOf(b, 'civilian').filter((c) => c.status !== 'dead').length, aliensLeft: unitsOf(b, 'alien').filter((u) => !isOut(u)).length });
export const forceKillAliens = (b: BattleState) => { for (const u of b.units) if (u.faction === 'alien' && u.originalFaction === 'alien' && !isOut(u)) { u.health = 0; kill(b, u); } };
export const destroyBrain = (b: BattleState) => { for (const t of b.map.tiles) if (t.object === 'brain') t.object = 'rubble'; };
