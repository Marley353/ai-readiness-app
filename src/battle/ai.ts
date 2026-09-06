// Alien and civilian turn logic: one atomic action per call so the scene can animate.
import type { BattleState, BattleUnit, Vec3, ShotKind } from './types';
import { ITEMS } from '../data/items';
import { battleRng, unitsOf, isOut, pathTo, stepUnit, handItem, canSee, lineOfFire, eyeVoxel, tileAt, unitAt } from './engine';
import { fire, throwItem, primeGrenade, psiAttack, tuCostPct, modeOf, type FireResult } from './combat';
import { VOXELS_PER_TILE as VT, VOXELS_PER_LEVEL as VL } from '../render/iso';

export type AiAction = { type: 'move'; uid: number; from: Vec3; to: Vec3; result: any } | { type: 'fire'; uid: number; result: FireResult; target: Vec3 } | { type: 'throw'; uid: number; result: FireResult } | { type: 'psi'; uid: number; target: number; success: boolean; kind: string } | { type: 'melee'; uid: number; result: FireResult; target: Vec3 } | { type: 'end' };
const dist = (a: Vec3, b: Vec3) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function nearestEnemy(b: BattleState, u: BattleUnit, visibleOnly: boolean): BattleUnit | null {
  const enemies = b.units.filter((o) => !isOut(o) && o.faction !== u.faction && (u.faction === 'alien' ? o.faction !== 'civilian' || u.race && ['chryssalid', 'reaper', 'silacoid', 'zombie'].includes(u.race) || true : true));
  const intel = u.aiState?.intelligence ?? 3;
  const known = enemies.filter((o) => (visibleOnly ? u.visibleUnits.includes(o.uid) : u.visibleUnits.includes(o.uid) || (o.faction === 'xcom' && o.turnsSinceSeen <= intel)));
  known.sort((a, c) => dist(a.pos, u.pos) - dist(c.pos, u.pos)); return known[0] ?? null;
}
function stepToward(b: BattleState, u: BattleUnit, target: Vec3, maxDist = 0): AiAction | null {
  const path = pathTo(b, u, target, 2500); if (!path || !path.path.length) return null;
  if (maxDist > 0 && dist(u.pos, target) <= maxDist) return null;
  const next = path.path[0]; const from = { ...u.pos }; const r = stepUnit(b, u, next); if (!r.ok) return null; u.movedThisTurn = (u.movedThisTurn ?? 0) + 1;
  return { type: 'move', uid: u.uid, from, to: { ...u.pos }, result: r };
}
function randomTarget(b: BattleState, u: BattleUnit): Vec3 { const { rng, save } = battleRng(b); for (let i = 0; i < 12; i++) { const p = { x: Math.max(0, Math.min(b.map.w - 1, u.pos.x + rng.int(-8, 8))), y: Math.max(0, Math.min(b.map.h - 1, u.pos.y + rng.int(-8, 8))), z: u.pos.z }; const t = tileAt(b, p.x, p.y, p.z); if (t && t.floor && !unitAt(b, p.x, p.y, p.z)) { save(); return p; } } save(); return { ...u.pos }; }
function chooseMode(u: BattleUnit, def: string, d: number): ShotKind | null { const it = ITEMS[def]; const can = (k: ShotKind) => { const m = modeOf(def, k); return m ? tuCostPct(u, m.tu) <= u.tu : false; }; if (d <= 6 && it.auto && can('auto')) return 'auto'; if (d > 12 && it.aimed && can('aimed')) return 'aimed'; if (it.snap && can('snap')) return 'snap'; if (it.aimed && can('aimed')) return 'aimed'; if (it.auto && can('auto')) return 'auto'; return null; }
export function aiStep(b: BattleState): AiAction | null {
  if (b.ended) return { type: 'end' };
  const side = b.side; if (side === 'xcom') return null;
  const units = b.units.filter((u) => u.faction === side && !isOut(u) && !u.aiDone && u.status !== 'panicking');
  if (!units.length) return { type: 'end' };
  const { rng, save } = battleRng(b);
  for (const u of units) {
    if (u.tu <= 0 || u.status === 'berserk') { u.aiDone = true; continue; }
    if (side === 'civilian') { const threat = b.units.filter((o) => o.faction === 'alien' && !isOut(o) && canSee(b, u, o)).sort((a, c) => dist(a.pos, u.pos) - dist(c.pos, u.pos))[0]; const target = threat ? { x: Math.max(0, Math.min(b.map.w - 1, u.pos.x + Math.sign(u.pos.x - threat.pos.x) * 6)), y: Math.max(0, Math.min(b.map.h - 1, u.pos.y + Math.sign(u.pos.y - threat.pos.y) * 6)), z: u.pos.z } : randomTarget(b, u); const a = stepToward(b, u, target); if (a) { save(); return a; } u.aiDone = true; continue; }
    const aggression = u.aiState?.aggression ?? 1; const meleeOnly = u.race && ['chryssalid', 'reaper', 'silacoid', 'zombie'].includes(u.race);
    const weapon = handItem(b, u, 'rightHand') ?? handItem(b, u, 'leftHand');
    // psionics on any soldier spotted this mission
    if (u.stats.psiSkill > 0 && (u.psiAttackedThisTurn ?? 0) < 2 && u.tu >= Math.floor(u.stats.tu * 0.25)) {
      const targets = b.units.filter((o) => o.originalFaction === 'xcom' && !isOut(o) && !o.mindControlled && !o.hwp && o.turnsSinceSeen < 99).sort((a, c) => a.stats.psiStrength - c.stats.psiStrength);
      if (targets.length && rng.percent(60)) { const t = targets[0]; const kind = rng.percent(40) ? 'control' : 'panic'; const r = psiAttack(b, u, t, kind); if (r.ok) { save(); return { type: 'psi', uid: u.uid, target: t.uid, success: r.success, kind }; } }
    }
    const visible = nearestEnemy(b, u, true);
    if (visible) {
      const d = dist(u.pos, visible.pos);
      if (meleeOnly || (weapon && ITEMS[weapon.def].battleType === 'melee')) {
        if (d <= 1 && visible.pos.z === u.pos.z) { const r = weapon ? fire(b, u, 'melee', visible.pos, weapon.uid) : meleeAttack(b, u, visible); if (r.ok) { save(); return { type: 'melee', uid: u.uid, result: r, target: visible.pos }; } }
        const a = stepToward(b, u, visible.pos, 1); if (a) { save(); return a; } u.aiDone = true; continue;
      }
      // grenade on a cluster
      const grenade = u.items.map((id) => b.items.find((i) => i.uid === id)!).find((i) => i && ITEMS[i.def].battleType === 'grenade');
      if (grenade && d >= 3 && d <= 8 && b.units.filter((o) => o.faction === 'xcom' && !isOut(o) && dist(o.pos, visible.pos) <= 2).length >= 2 && u.tu >= tuCostPct(u, 75)) { primeGrenade(b, u, grenade.uid, 0); const r = throwItem(b, u, grenade.uid, visible.pos); if (r.ok) { save(); return { type: 'throw', uid: u.uid, result: r }; } }
      if (weapon && ITEMS[weapon.def].battleType === 'firearm' && (weapon.rounds > 0 || !ITEMS[weapon.def].ammo?.length)) {
        const mode = chooseMode(u, weapon.def, d);
        const lof = lineOfFire(b, eyeVoxel(u), { x: visible.pos.x * VT + 8, y: visible.pos.y * VT + 8, z: visible.pos.z * VL + 10 }, u);
        if (mode && lof.kind === 'unit' && lof.unit === visible) { const r = fire(b, u, mode, visible.pos, weapon.uid); if (r.ok) { save(); return { type: 'fire', uid: u.uid, result: r, target: visible.pos }; } }
        if (mode && u.tu > tuCostPct(u, modeOf(weapon.def, mode)!.tu) + 8) { const a = stepToward(b, u, visible.pos, 2); if (a) { save(); return a; } }
      }
      if (weapon && ITEMS[weapon.def].ammo?.length && weapon.rounds <= 0) { const clip = u.items.map((id) => b.items.find((i) => i.uid === id)!).find((i) => i && ITEMS[weapon.def].ammo!.includes(i.def)); if (clip && u.tu >= 15) { u.tu -= 15; weapon.ammo = clip.def; weapon.rounds = clip.rounds; b.items = b.items.filter((i) => i.uid !== clip.uid); u.items = u.items.filter((id) => id !== clip.uid); continue; } }
      if (aggression === 0 && u.health < u.stats.health / 2) { const away = { x: Math.max(0, Math.min(b.map.w - 1, u.pos.x + Math.sign(u.pos.x - visible.pos.x) * 5)), y: Math.max(0, Math.min(b.map.h - 1, u.pos.y + Math.sign(u.pos.y - visible.pos.y) * 5)), z: u.pos.z }; const a = stepToward(b, u, away); if (a) { save(); return a; } }
      u.aiDone = true; continue;
    }
    // no visible enemy: hunt known positions or patrol; ambushers with reserved TU stay put
    const known = nearestEnemy(b, u, false);
    const reserveTu = weapon && ITEMS[weapon.def].snap ? tuCostPct(u, ITEMS[weapon.def].snap!.tu) : 0;
    if (u.tu <= reserveTu + 4 && aggression < 2) { u.aiDone = true; continue; }
    const target = known ? known.pos : ((u.aiState.patrol ??= randomTarget(b, u)));
    if (dist(u.pos, target) <= 1) { u.aiState.patrol = randomTarget(b, u); }
    const a = stepToward(b, u, target); if (a) { save(); return a; }
    u.aiState.patrol = randomTarget(b, u); u.aiDone = true;
  }
  save();
  return units.every((u) => u.aiDone) ? { type: 'end' } : null;
}
/** Unarmed melee for creatures (chryssalid claws, reaper bite, silacoid burn, zombie fists). */
export function meleeAttack(b: BattleState, u: BattleUnit, target: BattleUnit): FireResult {
  const cost = Math.floor(u.stats.tu * 0.3); if (u.tu < cost) return { ok: false, reason: 'NOT ENOUGH TIME UNITS', shots: [], sound: '', tu: 0, kind: 'melee', shooter: u.uid };
  const { rng, save } = battleRng(b); u.tu -= cost; const hit = rng.percent(u.stats.melee);
  let power = 40, type: any = 'melee'; if (u.race === 'reaper') power = 80; if (u.race === 'silacoid') { power = 60; type = 'incendiary'; } if (u.race === 'zombie') power = 35;
  const res: FireResult = { ok: true, shots: [{ origin: eyeVoxel(u), end: eyeVoxel(target), hit: { kind: hit ? 'unit' : 'none', pos: eyeVoxel(target), unit: hit ? target : undefined }, targetUid: target.uid }], sound: 'hit-flesh', tu: cost, kind: 'melee', shooter: u.uid };
  save();
  if (hit) { const { zombify, applyDamage, sideHit } = require_combat(); if (u.race === 'chryssalid' && !target.hwp && target.faction !== 'alien') { zombify(b, target, u); res.shots[0].killed = true; } else { const r = applyDamage(b, target, power, type, sideHit(target, u.pos), u); res.shots[0].damage = r.damage; res.shots[0].killed = r.killed; } u.exp.melee++; }
  return res;
}
import * as combatModule from './combat';
const require_combat = () => combatModule;
export function civilianStep(b: BattleState) { return aiStep(b); }
