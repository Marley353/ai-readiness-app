import { hooks } from '../app/testHooks';
import { getState } from '../core/state';
import * as B from './index';
import type { ShotKind, Vec3 } from './types';
export const battleHooks: Record<string, any> = {};
const st = () => { const b = getState().battle; if (!b) throw new Error('no battle'); return b; };
const unit = (uid: number) => { const u = B.unitByUid(st(), uid); if (!u) throw new Error('no unit ' + uid); return u; };
Object.assign(battleHooks, {
  create: (setup: any) => { const s = getState(); const base = s.bases.find((x) => x.id === setup.baseId) ?? s.bases[0]; s.battle = B.createBattle(setup, s.soldiers, base); return s.battle; },
  path: (uid: number, x: number, y: number, z: number) => B.pathTo(st(), unit(uid), { x, y, z }),
  step: (uid: number, x: number, y: number, z: number) => B.stepUnit(st(), unit(uid), { x, y, z }),
  turn: (uid: number, f: number) => B.turnUnit(st(), unit(uid), f as any),
  kneel: (uid: number) => B.kneel(st(), unit(uid)),
  vision: () => B.updateAllVision(st()),
  units: () => st().units.map((u) => ({ uid: u.uid, name: u.name, faction: u.faction, pos: u.pos, tu: u.tu, health: u.health, status: u.status, morale: u.morale })),
  tiles: (z: number) => { const b = st(); const out: any[] = []; for (let y = 0; y < b.map.h; y++) for (let x = 0; x < b.map.w; x++) out.push(b.map.tiles[B.tileIndex(b.map, x, y, z)]); return out; },
  fire: (uid: number, kind: ShotKind, x: number, y: number, z: number) => B.fire(st(), unit(uid), kind, { x, y, z }),
  throw: (uid: number, itemUid: number, x: number, y: number, z: number) => B.throwItem(st(), unit(uid), itemUid, { x, y, z }),
  prime: (uid: number, itemUid: number, turns: number) => B.primeGrenade(st(), unit(uid), itemUid, turns),
  explode: (x: number, y: number, z: number, power: number, type: any, radius: number) => B.explode(st(), { x, y, z }, power, type, radius),
  aiStep: () => B.aiStep(st()),
  runAiTurn: () => { const b = st(); if (b.side === 'xcom') B.endTurn(b); let guard = 0; while (b.side !== 'xcom' && guard++ < 2000) { const a = B.aiStep(b); if (!a || a.type === 'end') B.endTurn(b); if (b.ended) break; } B.checkMissionEnd(b); return { side: b.side, turn: b.turn }; },
  endTurn: () => B.endTurn(st()),
  tally: () => B.missionTally(st()),
  setMorale: (uid: number, m: number) => { unit(uid).morale = m; },
  psi: (uid: number, target: number, kind: 'panic' | 'control') => B.psiAttack(st(), unit(uid), unit(target), kind, true),
  forceKillAliens: () => B.forceKillAliens(st()),
  destroyBrain: () => B.destroyBrain(st()),
  damage: (uid: number, n: number) => B.applyDamage(st(), unit(uid), n, 'ap', 'front', undefined, false),
  missionEnd: () => B.checkMissionEnd(st()),
  abort: () => B.abortMission(st()),
  moveTo: (x: number, y: number, z: number, uid?: number) => { const b = st(); const u = uid ? unit(uid) : B.unitByUid(b, b.selectedUid ?? -1)!; const p = B.pathTo(b, u, { x, y, z }); if (!p) return { ok: false, reason: 'NO PATH' }; for (const step of p.path) { const r = B.stepUnit(b, u, step); if (!r.ok) return r; if (r.spotted.length || r.reactions.length) return { ...r, interrupted: true }; } return { ok: true, tu: u.tu }; },
  select: (uid: number) => { st().selectedUid = uid; },
});
export function installBattleHooks() { hooks.add('battle', battleHooks); }
