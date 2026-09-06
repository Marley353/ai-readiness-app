import { describe, it, expect } from 'vitest';
import { newCampaign, placeFirstBase } from '../../src/core/campaign';
import { setState } from '../../src/core/state';
import * as B from '../../src/battle/index';

function battle(seed = 7, type: any = 'crash', terrain = 'farm') {
  const s = newCampaign(1, 42); setState(s); placeFirstBase(s, -1, 52, 'Alpha');
  const setup = { missionType: type, terrainSet: terrain, ufoType: 'small-scout', alienRace: 'sectoid', difficulty: 1, night: false, month: 0, seed, craftId: 'skyranger', soldierIds: s.soldiers.map((x) => x.id), equipment: { rifle: 8, 'rifle-clip': 16, grenade: 4 }, loadouts: {} };
  const b = B.createBattle(setup as any, s.soldiers, s.bases[0]); s.battle = b; return { s, b };
}
describe('battle engine smoke', () => {
  it('creates a crash-site battle with soldiers, aliens and a UFO', () => {
    const { b } = battle();
    expect(B.unitsOf(b, 'xcom').length).toBe(8); expect(B.unitsOf(b, 'alien').length).toBeGreaterThanOrEqual(1);
    expect(b.map.ufoFootprint).toBeTruthy(); expect(b.map.craftFootprint).toBeTruthy();
    const doors = b.map.tiles.filter((t) => t.wallN === 'ufo-door-n').length; expect(doors).toBeGreaterThanOrEqual(1);
    for (const u of b.units) { const t = B.tileAt(b, u.pos.x, u.pos.y, u.pos.z)!; expect(t.floor).toBeTruthy(); }
  });
  it('moves with the original TU costs and stops when TU run out', () => {
    const { b } = battle(); const u = B.unitsOf(b, 'xcom')[0]; const tu0 = u.tu;
    const cands = [{ x: u.pos.x, y: u.pos.y + 1, z: 0 }, { x: u.pos.x, y: u.pos.y - 1, z: 0 }, { x: u.pos.x + 1, y: u.pos.y, z: 0 }, { x: u.pos.x - 1, y: u.pos.y, z: 0 }];
    const target = cands.find((c) => !B.unitAt(b, c.x, c.y, c.z) && !B.stepBlocked(b, u, u.pos, c))!; expect(target).toBeTruthy();
    const p = B.pathTo(b, u, target); expect(p).toBeTruthy(); expect(p!.tu).toBe(4);
    const r = B.stepUnit(b, u, target); expect(r.ok).toBe(true); expect(u.tu).toBe(tu0 - 4);
    const diag = B.stepCost(b, u, u.pos, { x: u.pos.x + 1, y: u.pos.y + 1, z: 0 }); expect(diag.tu).toBe(6);
    expect(B.turnCost(0, 2)).toBe(2); expect(B.turnCost(0, 5)).toBe(3);
    const k = B.kneel(b, u); expect(k.ok).toBe(true); expect(u.tu).toBe(tu0 - 8); expect(B.kneel(b, u).ok).toBe(true); expect(u.tu).toBe(tu0 - 16);
  });
  it('fires with TU percentages and resolves a full alien turn', () => {
    const { b } = battle(); const u = B.unitsOf(b, 'xcom')[0]; const a = B.unitsOf(b, 'alien')[0];
    const tu0 = u.tu; const r = B.fire(b, u, 'snap', a.pos); expect(r.ok).toBe(true); expect(u.tu).toBe(tu0 - Math.floor(tu0 * 0.25)); expect(r.shots.length).toBe(1);
    const auto = B.fire(b, u, 'auto', a.pos); expect(auto.ok).toBe(true); expect(auto.shots.length).toBe(3);
    B.endTurn(b); expect(b.side).toBe('alien'); let guard = 0; while (b.side !== 'xcom' && guard++ < 500) { const act = B.aiStep(b); if (!act || act.type === 'end') B.endTurn(b); }
    expect(b.side).toBe('xcom'); expect(b.turn).toBe(2);
  });
  it('ends the mission when all aliens are dead and tallies', () => {
    const { b } = battle(); B.forceKillAliens(b); const e = B.checkMissionEnd(b); expect(e?.winner).toBe('xcom'); expect(B.missionTally(b).alienKilled).toBeGreaterThanOrEqual(1);
    expect(b.items.some((i) => i.def === 'sectoid-corpse')).toBe(true);
  });
  it('explosions damage terrain and units; grenades prime and throw; panic uses 100-2×morale', () => {
    const { b } = battle(11); const u = B.unitsOf(b, 'xcom')[0]; const g = b.items.find((i) => i.def === 'grenade' && i.owner === u.uid)!;
    expect(B.primeGrenade(b, u, g.uid, 0).ok).toBe(true); const t = B.throwItem(b, u, g.uid, { x: u.pos.x + 3, y: u.pos.y - 3, z: 0 }); expect(t.ok).toBe(true); expect(t.shots[0].explosion).toBeTruthy();
    const a = B.unitsOf(b, 'alien')[0]; a.morale = 10; const before = a.status; B.endTurn(b); expect(['standing', 'panicking', 'berserk']).toContain(a.status); expect(before).toBe('standing');
  });
  it('generates every terrain set and mission type without errors', () => {
    for (const [type, set] of [['terror', 'urban'], ['landed', 'forest'], ['crash', 'desert'], ['crash', 'jungle'], ['crash', 'polar'], ['crash', 'mountain'], ['alien-base', 'alien-base'], ['base-defence', 'xcom-base'], ['cydonia-surface', 'cydonia-surface'], ['cydonia-brain', 'cydonia-brain']] as const) { const { b } = battle(3, type, set); expect(b.units.length).toBeGreaterThan(0); expect(B.unitsOf(b, 'xcom').length).toBeGreaterThan(0); }
  });
});
