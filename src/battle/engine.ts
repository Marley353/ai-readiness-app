// Battlescape core: map generation, unit spawning, vision, pathfinding, movement, turn structure, items on the map.
import type { BattleState, BattleSetup, BattleMap, Tile, BattleUnit, BattleItem, Vec3, Facing, Faction, InvSlot } from './types';
import type { Soldier, Base } from '../core/state';
import type { AlienRank, TerrainTileDef, UnitStats } from '../data/types';
import { Rng } from '../core/rng';
import { TERRAIN_SETS } from '../data/terrain';
import { ITEMS } from '../data/items';
import { ALIENS, DIFFICULTY_ALIEN_STAT_SCALE } from '../data/aliens';
import { UFOS } from '../data/ufos';
import { CRAFT } from '../data/craft';
import { MISSION_SCHEDULE } from '../data/missions';
import { FACING_DX, FACING_DY, VOXELS_PER_TILE as VT, VOXELS_PER_LEVEL as VL } from '../render/iso';
import { SLOTS, fits, TU_MOVE, TU_LOAD, TU_UNLOAD, weightOf } from '../inventory/layout';
import { NAMES_M, NAMES_F, NAMES_LAST } from '../data/names';

export const SIGHT_DAY = 20, SIGHT_NIGHT = 9, KNEEL_TU = 4, STAND_TU = 8, TURN_TU = 1;
export const battleRng = (b: BattleState) => { const r = new Rng(b.rngState); return { rng: r, save: () => { b.rngState = r.state; } }; };

// ---------- Tiles ----------
export const tileIndex = (m: BattleMap, x: number, y: number, z: number) => (z * m.h + y) * m.w + x;
export const inMap = (m: BattleMap, x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < m.w && y < m.h && z < m.levels;
export const tileAt = (b: BattleState, x: number, y: number, z: number): Tile | null => (inMap(b.map, x, y, z) ? b.map.tiles[tileIndex(b.map, x, y, z)] : null);
export const tileDefOf = (b: BattleState, id: string | null): TerrainTileDef | undefined => (id ? defCache(b.map.terrainSet).get(id) ?? defCache('ufo-interior').get(id) ?? defCache('xcom-base').get(id) ?? defCache('alien-base').get(id) : undefined);
const caches = new Map<string, Map<string, TerrainTileDef>>();
function defCache(set: string) { let c = caches.get(set); if (!c) { c = new Map(); for (const t of TERRAIN_SETS[set]?.tiles ?? []) c.set(t.id, t); caches.set(set, c); } return c; }
const emptyTile = (): Tile => ({ floor: null, wallN: null, wallW: null, object: null, smoke: 0, fire: 0, light: 0, seen: false, visible: false });
export const unitAt = (b: BattleState, x: number, y: number, z: number): BattleUnit | undefined => b.units.find((u) => u.status !== 'dead' && u.pos.z === z && x >= u.pos.x && x < u.pos.x + u.size && y >= u.pos.y && y < u.pos.y + u.size);
export const unitsOf = (b: BattleState, f: Faction) => b.units.filter((u) => u.faction === f && u.status !== 'dead');
export const isOut = (u: BattleUnit) => u.status === 'dead' || u.status === 'unconscious';
export const itemsAt = (b: BattleState, p: Vec3) => b.items.filter((i) => i.tile && i.tile.x === p.x && i.tile.y === p.y && i.tile.z === p.z);
export const unitByUid = (b: BattleState, uid: number) => b.units.find((u) => u.uid === uid);
export const itemByUid = (b: BattleState, uid: number) => b.items.find((i) => i.uid === uid);
export const partHeight = (b: BattleState, t: Tile, part: 'wallN' | 'wallW' | 'object') => { const d = tileDefOf(b, t[part]); return d ? d.height : 0; };
export const blocksVisionPart = (b: BattleState, t: Tile, part: 'wallN' | 'wallW' | 'object') => { const d = tileDefOf(b, t[part]); if (!d) return false; if (part !== 'object' && d.door && (part === 'wallN' ? t.doorOpen : t.doorOpen)) return false; return !!d.blocksVision; };
export const hasFloor = (b: BattleState, x: number, y: number, z: number) => { const t = tileAt(b, x, y, z); return !!t && (!!t.floor || z === 0); };
const isBlockingObject = (b: BattleState, t: Tile | null) => { if (!t || !t.object) return false; const d = tileDefOf(b, t.object); return !!d && d.object === true && !d.lift && d.height >= 8; };

// ---------- Map generation ----------
interface Gen { b: BattleState; rng: Rng; set: string }
function fillFloor(g: Gen, id: string) { const m = g.b.map; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) m.tiles[tileIndex(m, x, y, 0)].floor = id; }
function setPart(g: Gen, x: number, y: number, z: number, part: 'floor' | 'wallN' | 'wallW' | 'object', id: string | null) { const t = tileAt(g.b, x, y, z); if (t) t[part] = id; }
function box(g: Gen, x0: number, y0: number, w: number, h: number, z: number, wallN: string, wallW: string, floor: string | null, doors: { side: 'n' | 's' | 'e' | 'w'; at: number; id: string }[] = []) {
  for (let x = x0; x < x0 + w; x++) { setPart(g, x, y0, z, 'wallN', wallN); setPart(g, x, y0 + h, z, 'wallN', wallN); }
  for (let y = y0; y < y0 + h; y++) { setPart(g, x0, y, z, 'wallW', wallW); setPart(g, x0 + w, y, z, 'wallW', wallW); }
  if (floor) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { setPart(g, x, y, z, 'floor', floor); setPart(g, x, y, z, 'object', null); }
  for (const d of doors) { if (d.side === 'n') setPart(g, x0 + d.at, y0, z, 'wallN', d.id); if (d.side === 's') setPart(g, x0 + d.at, y0 + h, z, 'wallN', d.id); if (d.side === 'w') setPart(g, x0, y0 + d.at, z, 'wallW', d.id); if (d.side === 'e') setPart(g, x0 + w, y0 + d.at, z, 'wallW', d.id); }
}
const areaFree = (g: Gen, x0: number, y0: number, w: number, h: number) => { const m = g.b.map; if (x0 < 1 || y0 < 1 || x0 + w >= m.w - 1 || y0 + h >= m.h - 1) return false; for (const bl of m.blocks) if (x0 < bl.x + bl.w + 1 && x0 + w + 1 > bl.x && y0 < bl.y + bl.h + 1 && y0 + h + 1 > bl.y) return false; return true; };
function claim(g: Gen, x: number, y: number, w: number, h: number, kind: string) { g.b.map.blocks.push({ x, y, w, h, kind }); }
function scatter(g: Gen, id: string, count: number, avoidBlocks = true) { const m = g.b.map; for (let i = 0; i < count; i++) { const x = g.rng.int(0, m.w - 1), y = g.rng.int(0, m.h - 1); if (avoidBlocks && m.blocks.some((bl) => x >= bl.x - 1 && x <= bl.x + bl.w && y >= bl.y - 1 && y <= bl.y + bl.h)) continue; const t = tileAt(g.b, x, y, 0)!; if (!t.object && !t.wallN && !t.wallW) t.object = id; } }
function placeUfo(g: Gen, ufoType: string, crashed: boolean) {
  const ut = UFOS[ufoType]; const m = g.b.map; const w = ut.footprint.w, h = ut.footprint.h;
  let x0 = Math.floor(m.w / 2) - Math.floor(w / 2) + g.rng.int(-6, 6), y0 = Math.floor(m.h / 3) - Math.floor(h / 2) + g.rng.int(-4, 4);
  x0 = Math.max(2, Math.min(m.w - w - 3, x0)); y0 = Math.max(2, Math.min(m.h - h - 3, y0));
  claim(g, x0, y0, w, h, 'ufo'); m.ufoFootprint = { x: x0, y: y0, w, h };
  box(g, x0, y0, w, h, 0, 'ufo-wall-n', 'ufo-wall-w', 'ufo-floor', [{ side: 's', at: Math.floor(w / 2), id: 'ufo-door-n' }]);
  if (h >= 8) { const my = y0 + Math.floor(h / 2); for (let x = x0; x < x0 + w; x++) setPart(g, x, my, 0, 'wallN', 'ufo-wall-n'); setPart(g, x0 + Math.floor(w / 2), my, 0, 'wallN', 'ufo-door-n'); if (w >= 12) { setPart(g, x0 + 2, my, 0, 'wallN', 'ufo-door-n'); } }
  const ps = Math.max(1, ut.recovery.find((r) => r.id === 'ufo-power-source')?.qty ?? 1), nav = ut.recovery.find((r) => r.id === 'ufo-navigation')?.qty ?? 1;
  for (let i = 0; i < ps; i++) setPart(g, x0 + 1 + i * 2, y0 + Math.floor(h / 4), 0, 'object', crashed && g.rng.percent(50) ? 'rubble' : 'power-source');
  for (let i = 0; i < nav; i++) setPart(g, x0 + w - 2 - i, y0 + 1, 0, 'object', 'nav-console');
  if (ut.size === 'medium' || ut.size === 'large' || ut.size === 'very-large') { for (let i = 0; i < 3; i++) setPart(g, x0 + 1 + g.rng.int(0, w - 3), y0 + h - 2 - g.rng.int(0, 2), 0, 'object', 'alien-pod'); }
  if (ut.footprint.levels > 1 && m.levels > 1) {
    const iw = w - 4, ih = h - 4, ix = x0 + 2, iy = y0 + 2;
    for (let y = iy; y < iy + ih; y++) for (let x = ix; x < ix + iw; x++) { setPart(g, x, y, 1, 'floor', 'ufo-floor'); }
    box(g, ix, iy, iw, ih, 1, 'ufo-wall-n', 'ufo-wall-w', null);
    setPart(g, ix + 1, iy + 1, 0, 'object', 'ufo-lift'); setPart(g, ix + 1, iy + 1, 1, 'floor', 'ufo-lift'); setPart(g, ix + 1, iy + 1, 0, 'floor', 'ufo-lift');
    setPart(g, ix + iw - 2, iy + 1, 1, 'object', 'nav-console');
  }
  if (crashed) { for (let i = 0; i < 6; i++) { const x = x0 + g.rng.int(-2, w + 1), y = y0 + g.rng.int(-2, h + 1); const t = tileAt(g.b, x, y, 0); if (t && !m.blocks.some((bl) => bl.kind === 'ufo' && x >= bl.x && x < bl.x + bl.w && y >= bl.y && y < bl.y + bl.h)) { t.floor = 'crater'; t.object = g.rng.percent(50) ? 'rubble' : t.object; } } const side = g.rng.int(0, 1); for (let k = 0; k < 3; k++) setPart(g, side ? x0 : x0 + w, y0 + 1 + k, 0, 'wallW', null); }
  m.spawnAlien.length = 0; for (let y = y0 + 1; y < y0 + h - 1; y++) for (let x = x0 + 1; x < x0 + w - 1; x++) if (!tileAt(g.b, x, y, 0)!.object) m.spawnAlien.push({ x, y, z: 0 });
}
function placeCraft(g: Gen, craftId: string) {
  const m = g.b.map; const w = craftId === 'avenger' ? 9 : craftId === 'lightning' ? 7 : 5, h = craftId === 'avenger' ? 11 : craftId === 'lightning' ? 7 : 8;
  let x0 = Math.floor(m.w / 2) - Math.floor(w / 2) + g.rng.int(-8, 8), y0 = m.h - h - 4;
  x0 = Math.max(2, Math.min(m.w - w - 3, x0));
  claim(g, x0, y0, w, h, 'craft'); m.craftFootprint = { x: x0, y: y0, w, h };
  box(g, x0, y0, w, h, 0, 'xcom-wall-n', 'xcom-wall-w', 'xcom-floor');
  for (let x = x0; x < x0 + w; x++) setPart(g, x, y0 + h, 0, 'wallN', null); // open ramp on the south side
  m.spawnXcom.length = 0; for (let y = y0 + 1; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) m.spawnXcom.push({ x, y, z: 0 });
}
function house(g: Gen, x0: number, y0: number, w: number, h: number, wallN: string, wallW: string, floor: string, door: string, furniture: string[]) {
  claim(g, x0, y0, w, h, 'building');
  box(g, x0, y0, w, h, 0, wallN, wallW, floor, [{ side: g.rng.pick(['s', 'e', 'w', 'n']), at: g.rng.int(1, Math.min(w, h) - 2), id: door }]);
  if (w > 5) for (let x = x0 + 1; x < x0 + w - 1; x += 2) if (g.rng.percent(40)) setPart(g, x, y0, 0, 'wallN', wallN === 'wall-n' ? 'wall-n-window' : wallN);
  for (const f of furniture) setPart(g, x0 + g.rng.int(1, w - 2), y0 + g.rng.int(1, h - 2), 0, 'object', f);
  if (h >= 6 && w >= 6 && g.b.map.levels > 1 && g.rng.percent(60)) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPart(g, x, y, 1, 'floor', 'floor-wood'); box(g, x0, y0, w, h, 1, wallN, wallW, null); setPart(g, x0 + 1, y0 + 1, 0, 'object', 'stairs-n'); setPart(g, x0 + 1, y0 + 1, 1, 'floor', 'lift'); for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPart(g, x, y, 2, 'floor', 'roof'); }
}
function terrainModules(g: Gen) {
  const m = g.b.map; const s = g.set;
  if (s === 'farm') { fillFloor(g, 'floor'); for (let k = 0; k < 4; k++) { const fw = g.rng.int(6, 12), fh = g.rng.int(5, 9), fx = g.rng.int(1, m.w - fw - 2), fy = g.rng.int(1, m.h - fh - 2); if (!areaFree(g, fx, fy, fw, fh)) continue; for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fw; x++) setPart(g, x, y, 0, 'floor', g.rng.percent(50) ? 'field' : 'field-crop'); for (let x = fx; x <= fx + fw; x++) { setPart(g, x, fy, 0, 'wallN', 'fence-n'); setPart(g, x, fy + fh, 0, 'wallN', 'fence-n'); } for (let y = fy; y < fy + fh; y++) { setPart(g, fx, y, 0, 'wallW', 'fence-w'); setPart(g, fx + fw, y, 0, 'wallW', 'fence-w'); } setPart(g, fx + Math.floor(fw / 2), fy + fh, 0, 'wallN', null); claim(g, fx, fy, fw, fh, 'field'); }
    for (let k = 0; k < 2; k++) { const w = g.rng.int(5, 8), h = g.rng.int(5, 7); const x = g.rng.int(2, m.w - w - 3), y = g.rng.int(2, m.h - h - 3); if (areaFree(g, x, y, w, h)) house(g, x, y, w, h, k ? 'barn-wall-n' : 'wall-n', k ? 'barn-wall-w' : 'wall-w', k ? 'floor-wood' : 'floor-wood', 'door-n', k ? ['crate', 'crate'] : ['table', 'chair', 'bed']); }
    scatter(g, 'tree', Math.floor(m.w * m.h / 60)); scatter(g, 'bush', Math.floor(m.w * m.h / 90)); for (let y = 0; y < m.h; y++) if (g.rng.percent(6)) for (let x = 0; x < m.w; x++) { const t = tileAt(g.b, x, y, 0)!; if (!m.blocks.some((bl) => x >= bl.x && x < bl.x + bl.w + 1 && y >= bl.y && y < bl.y + bl.h + 1)) setPart(g, x, y, 0, 'wallN', g.rng.percent(70) ? 'hedge-n' : null); }
  } else if (s === 'urban') { fillFloor(g, 'pavement'); const rx = Math.floor(m.w / 2) + g.rng.int(-6, 6), ry = Math.floor(m.h / 2) + g.rng.int(-6, 6); for (let y = 0; y < m.h; y++) for (let x = rx - 2; x <= rx + 2; x++) setPart(g, x, y, 0, 'floor', x === rx ? 'road-line' : 'road'); for (let x = 0; x < m.w; x++) for (let y = ry - 2; y <= ry + 2; y++) setPart(g, x, y, 0, 'floor', y === ry ? 'road-line' : 'road'); claim(g, rx - 2, 0, 5, m.h, 'road'); claim(g, 0, ry - 2, m.w, 5, 'road');
    for (let k = 0; k < 7; k++) { const w = g.rng.int(5, 9), h = g.rng.int(5, 8); const x = g.rng.int(2, m.w - w - 3), y = g.rng.int(2, m.h - h - 3); if (areaFree(g, x, y, w, h)) house(g, x, y, w, h, g.rng.percent(50) ? 'wall-n' : 'shop-n', g.rng.percent(50) ? 'wall-w' : 'shop-w', 'floor-concrete', 'door-n', ['table', 'chair', 'crate', 'bed'].slice(0, g.rng.int(1, 3))); }
    for (let k = 0; k < 4; k++) setPart(g, rx + g.rng.pick([-2, 2]), g.rng.int(2, m.h - 3), 0, 'object', 'car'); for (let k = 0; k < 6; k++) setPart(g, g.rng.int(1, m.w - 2), ry + g.rng.pick([-3, 3]), 0, 'object', 'lamp'); scatter(g, 'tree', 6);
  } else if (s === 'forest') { fillFloor(g, 'floor'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(12)) setPart(g, x, y, 0, 'floor', 'leaf-litter'); scatter(g, 'tree', Math.floor(m.w * m.h / 9)); scatter(g, 'tree-dark', Math.floor(m.w * m.h / 14)); scatter(g, 'rock', 12); scatter(g, 'bush', 20);
  } else if (s === 'desert') { fillFloor(g, 'floor'); scatter(g, 'boulder', 18); scatter(g, 'cactus', 25); scatter(g, 'rock', 10); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(15)) setPart(g, x, y, 0, 'floor', 'dune'); if (areaFree(g, 6, 6, 7, 6)) house(g, 6, 6, 7, 6, 'half-wall-n', 'half-wall-w', 'floor', 'door-n', ['rubble', 'rubble']);
  } else if (s === 'jungle') { fillFloor(g, 'floor'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(10)) setPart(g, x, y, 0, 'floor', 'mud'); scatter(g, 'tree', Math.floor(m.w * m.h / 10)); scatter(g, 'palm', Math.floor(m.w * m.h / 16)); scatter(g, 'undergrowth', Math.floor(m.w * m.h / 12)); if (areaFree(g, 8, 8, 6, 6)) house(g, 8, 8, 6, 6, 'half-wall-n', 'half-wall-w', 'floor-concrete', 'door-n', ['rubble', 'pillar']);
  } else if (s === 'polar') { fillFloor(g, 'floor'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(20)) setPart(g, x, y, 0, 'floor', 'ice'); scatter(g, 'snowbank', 30); scatter(g, 'ice-rock', 12); if (areaFree(g, 8, 8, 6, 5)) house(g, 8, 8, 6, 5, 'wall-n', 'wall-w', 'floor-wood', 'door-n', ['crate', 'bed', 'table']);
  } else if (s === 'mountain') { fillFloor(g, 'floor'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(18)) setPart(g, x, y, 0, 'floor', 'scree'); scatter(g, 'boulder', 30); scatter(g, 'pine', 25); scatter(g, 'ledge', 6);
  } else if (s === 'alien-base' || s === 'cydonia-brain') { alienBaseLayout(g, s === 'cydonia-brain'); }
  else if (s === 'cydonia-surface') { fillFloor(g, 'floor'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (g.rng.percent(15)) setPart(g, x, y, 0, 'floor', 'mars-dust'); for (let k = 0; k < 5; k++) { const w = g.rng.int(4, 7), x = g.rng.int(2, m.w - w - 3), y = g.rng.int(2, m.h - w - 3); if (!areaFree(g, x, y, w, w)) continue; claim(g, x, y, w, w, 'pyramid'); for (let yy = y; yy < y + w; yy++) for (let xx = x; xx < x + w; xx++) if (yy === y || yy === y + w - 1 || xx === x || xx === x + w - 1) setPart(g, xx, yy, 0, 'object', 'pyramid-block'); } const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { setPart(g, cx + dx, cy + dy, 0, 'object', null); setPart(g, cx + dx, cy + dy, 0, 'floor', Math.abs(dx) <= 1 && Math.abs(dy) <= 1 ? 'descent-lift' : 'floor'); } claim(g, cx - 2, cy - 2, 5, 5, 'lift'); scatter(g, 'boulder', 20); }
}
function alienBaseLayout(g: Gen, brain: boolean) {
  const m = g.b.map; fillFloor(g, 'alien-floor');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = tileAt(g.b, x, y, 0)!; t.floor = null; }
  const cell = 7, cols = Math.floor((m.w - 2) / cell), rows = Math.floor((m.h - 2) / cell);
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (g.rng.percent(25)) continue; const x = 1 + c * cell, y = 1 + r * cell; rooms.push({ x, y, w: cell - 1, h: cell - 1 }); }
  for (const rm of rooms) { for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) setPart(g, x, y, 0, 'floor', 'alien-floor'); box(g, rm.x, rm.y, rm.w, rm.h, 0, 'alien-wall-n', 'alien-wall-w', null, [{ side: 'e', at: 3, id: 'alien-door-w' }, { side: 's', at: 3, id: 'alien-door-n' }]); claim(g, rm.x, rm.y, rm.w, rm.h, 'room'); }
  // corridors: connect room doors with floor strips
  for (const rm of rooms) { for (let x = rm.x + rm.w; x < rm.x + rm.w + 1; x++) for (let y = rm.y + 2; y < rm.y + 5; y++) setPart(g, x, y, 0, 'floor', 'alien-floor'); for (let y = rm.y + rm.h; y < rm.y + rm.h + 1; y++) for (let x = rm.x + 2; x < rm.x + 5; x++) setPart(g, x, y, 0, 'floor', 'alien-floor'); }
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = tileAt(g.b, x, y, 0)!; if (!t.floor) { t.floor = 'alien-floor'; if (!rooms.some((rm) => x >= rm.x - 1 && x <= rm.x + rm.w && y >= rm.y - 1 && y <= rm.y + rm.h)) t.object = g.rng.percent(55) ? 'alien-pod' : null; } }
  const centre = rooms[Math.floor(rooms.length / 2)] ?? { x: 4, y: 4, w: 6, h: 6 };
  if (brain) { setPart(g, centre.x + 2, centre.y + 2, 0, 'object', 'brain'); setPart(g, centre.x + 3, centre.y + 2, 0, 'object', 'brain'); } else { setPart(g, centre.x + 1, centre.y + 1, 0, 'object', 'control-console'); setPart(g, centre.x + 4, centre.y + 1, 0, 'object', 'control-console'); setPart(g, centre.x + 2, centre.y + 4, 0, 'object', 'power-source'); }
  const first = rooms[0] ?? centre; setPart(g, first.x + 1, first.y + 1, 0, 'floor', 'alien-lift'); setPart(g, first.x + 2, first.y + 1, 0, 'floor', 'alien-lift'); setPart(g, first.x + 1, first.y + 2, 0, 'floor', 'alien-lift'); setPart(g, first.x + 2, first.y + 2, 0, 'floor', 'alien-lift');
  m.spawnXcom = [{ x: first.x + 1, y: first.y + 1, z: 0 }, { x: first.x + 2, y: first.y + 1, z: 0 }, { x: first.x + 1, y: first.y + 2, z: 0 }, { x: first.x + 2, y: first.y + 2, z: 0 }, { x: first.x + 3, y: first.y + 1, z: 0 }, { x: first.x + 3, y: first.y + 2, z: 0 }, { x: first.x + 1, y: first.y + 3, z: 0 }, { x: first.x + 2, y: first.y + 3, z: 0 }, { x: first.x + 3, y: first.y + 3, z: 0 }, { x: first.x + 4, y: first.y + 1, z: 0 }, { x: first.x + 4, y: first.y + 2, z: 0 }, { x: first.x + 4, y: first.y + 3, z: 0 }, { x: first.x + 1, y: first.y + 4, z: 0 }, { x: first.x + 2, y: first.y + 4, z: 0 }];
  m.spawnAlien = rooms.slice(1).flatMap((rm) => [{ x: rm.x + 1, y: rm.y + 1, z: 0 }, { x: rm.x + 3, y: rm.y + 3, z: 0 }, { x: rm.x + 4, y: rm.y + 1, z: 0 }]);
  claim(g, centre.x, centre.y, centre.w, centre.h, 'command');
}
function xcomBaseLayout(g: Gen, base: Base) {
  const m = g.b.map; fillFloor(g, 'xcom-floor');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = tileAt(g.b, x, y, 0)!; t.floor = null; }
  const cell = 8; m.spawnXcom = []; m.spawnAlien = [];
  for (const f of base.facilities.filter((x) => x.daysLeft <= 0)) {
    const size = f.def === 'hangar' ? 2 : 1; const x0 = 1 + f.x * cell, y0 = 1 + f.y * cell, w = size * cell - 2, h = size * cell - 2;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPart(g, x, y, 0, 'floor', 'xcom-floor');
    box(g, x0, y0, w, h, 0, 'xcom-wall-n', 'xcom-wall-w', null, [{ side: 'e', at: 2, id: 'xcom-door-w' }, { side: 's', at: 2, id: 'xcom-door-n' }, { side: 'w', at: 2, id: 'xcom-door-w' }, { side: 'n', at: 2, id: 'xcom-door-n' }]);
    for (let x = x0 + w; x < x0 + w + 2; x++) setPart(g, x, y0 + 2, 0, 'floor', 'xcom-floor'); for (let y = y0 + h; y < y0 + h + 2; y++) setPart(g, x0 + 2, y, 0, 'floor', 'xcom-floor');
    for (let x = x0 - 2; x < x0; x++) setPart(g, x, y0 + 2, 0, 'floor', 'xcom-floor'); for (let y = y0 - 2; y < y0; y++) setPart(g, x0 + 2, y, 0, 'floor', 'xcom-floor');
    const spots = [{ x: x0 + 1, y: y0 + 1, z: 0 }, { x: x0 + w - 2, y: y0 + 1, z: 0 }, { x: x0 + 1, y: y0 + h - 2, z: 0 }, { x: x0 + w - 2, y: y0 + h - 2, z: 0 }, { x: x0 + 3, y: y0 + 3, z: 0 }];
    if (f.def === 'hangar' || f.def === 'access-lift') m.spawnAlien.push(...spots); else m.spawnXcom.push(...spots);
    if (f.def === 'living-quarters') { setPart(g, x0 + 1, y0 + 1, 0, 'object', 'bed'); setPart(g, x0 + 3, y0 + 1, 0, 'object', 'bed'); } if (f.def === 'general-stores') { setPart(g, x0 + 2, y0 + 2, 0, 'object', 'crate'); setPart(g, x0 + 4, y0 + 3, 0, 'object', 'crate'); } if (f.def === 'laboratory' || f.def === 'workshop') { setPart(g, x0 + 2, y0 + 2, 0, 'object', 'table'); setPart(g, x0 + 4, y0 + 2, 0, 'object', 'console'); } if (f.def === 'access-lift') { for (let y = y0 + 2; y < y0 + 4; y++) for (let x = x0 + 2; x < x0 + 4; x++) setPart(g, x, y, 0, 'floor', 'lift'); }
    claim(g, x0, y0, w, h, f.def);
  }
  if (!m.spawnXcom.length) m.spawnXcom = m.spawnAlien.splice(0, 5);
}
function makeMap(setup: BattleSetup, rng: Rng, base?: Base): BattleMap {
  const big = setup.missionType === 'terror' || setup.missionType === 'base-defence' || setup.missionType === 'alien-base' || setup.ufoType === 'battleship' || setup.missionType.startsWith('cydonia');
  const size = big ? 60 : setup.ufoType && UFOS[setup.ufoType].size !== 'very-small' && UFOS[setup.ufoType].size !== 'small' ? 50 : 40;
  const levels = setup.missionType === 'alien-base' || setup.missionType === 'cydonia-brain' || setup.missionType === 'base-defence' ? 1 : 4;
  const m: BattleMap = { w: size, h: size, levels, terrainSet: setup.terrainSet, tiles: [], night: setup.night, ambientLight: setup.night ? 4 : 15, spawnXcom: [], spawnAlien: [], spawnCivilian: [], blocks: [] };
  for (let i = 0; i < size * size * levels; i++) m.tiles.push(emptyTile());
  const b = { map: m } as BattleState; const g: Gen = { b, rng, set: setup.terrainSet };
  if (setup.missionType === 'base-defence' && base) xcomBaseLayout(g, base);
  else if (setup.missionType === 'alien-base' || setup.missionType === 'cydonia-brain') terrainModules(g);
  else {
    if (setup.ufoType && (setup.missionType === 'crash' || setup.missionType === 'landed')) placeUfo(g, setup.ufoType, setup.missionType === 'crash');
    placeCraft(g, setup.craftId ?? 'skyranger');
    terrainModules(g);
    if (!m.spawnAlien.length) { for (let i = 0; i < 40; i++) { const x = rng.int(1, size - 2), y = rng.int(1, Math.floor(size * 0.6)); const t = tileAt(b, x, y, 0)!; if (!t.object && t.floor && !m.blocks.some((bl) => bl.kind === 'craft' && x >= bl.x - 2 && x <= bl.x + bl.w + 2 && y >= bl.y - 2 && y <= bl.y + bl.h + 2)) m.spawnAlien.push({ x, y, z: 0 }); } }
    if (setup.missionType === 'terror') { for (let i = 0; i < 60; i++) { const x = rng.int(1, size - 2), y = rng.int(1, size - 2); const t = tileAt(b, x, y, 0)!; if (!t.object && t.floor) m.spawnCivilian.push({ x, y, z: 0 }); } }
  }
  // outside alien spawns for surface missions
  if (setup.missionType === 'crash' || setup.missionType === 'landed' || setup.missionType === 'terror' || setup.missionType === 'cydonia-surface' || setup.missionType === 'tutorial') { for (let i = 0; i < 30; i++) { const x = rng.int(1, size - 2), y = rng.int(1, Math.floor(size * 0.65)); const t = tileAt(b, x, y, 0)!; if (!t.object && t.floor && !m.blocks.some((bl) => x >= bl.x - 1 && x <= bl.x + bl.w + 1 && y >= bl.y - 1 && y <= bl.y + bl.h + 1)) m.spawnAlien.push({ x, y, z: 0 }); } }
  return m;
}

// ---------- Units and items ----------
let uidCounter = 1;
function newItem(b: BattleState, def: string, owner?: BattleUnit, slot?: InvSlot, gx = 0, gy = 0, ammo?: string, rounds?: number): BattleItem {
  const d = ITEMS[def]; const it: BattleItem = { uid: b.nextUid++, def, rounds: rounds ?? (d?.clipSize ?? 0), owner: owner?.uid, slot, gx, gy };
  if (ammo) { it.ammo = ammo; it.rounds = rounds ?? ITEMS[ammo]?.clipSize ?? 0; } else if (d?.ammo?.length) { it.rounds = 0; }
  b.items.push(it); if (owner) owner.items.push(it.uid); return it;
}
export function makeUnit(b: BattleState, p: { name: string; faction: Faction; stats: UnitStats; armour: BattleUnit['armour']; damageMod: BattleUnit['damageMod']; pos: Vec3; facing: Facing; size?: 1 | 2; race?: string; rank?: string; soldierId?: number; hwp?: string; flying?: boolean; standHeight?: number; kneelHeight?: number; unitSprite: string; energyRecovery?: number; armourDef?: string }): BattleUnit {
  const u: BattleUnit = { uid: b.nextUid++, name: p.name, faction: p.faction, originalFaction: p.faction, race: p.race, rank: p.rank, soldierId: p.soldierId, hwp: p.hwp, pos: { ...p.pos }, facing: p.facing, size: p.size ?? 1, stats: { ...p.stats }, tu: p.stats.tu, energy: p.stats.stamina, health: p.stats.health, morale: 100, stun: 0, status: 'standing', kneeling: false, flying: !!p.flying, armour: { ...p.armour }, armourDef: p.armourDef, damageMod: { ...p.damageMod }, wounds: { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 }, fire: 0, items: [], visibleTo: [], visibleUnits: [], spotted: false, turnsSinceSeen: 99, kills: 0, exp: { firing: 0, throwing: 0, melee: 0, reactions: 0, psiSkill: 0, bravery: 0 }, standHeight: p.standHeight ?? 22, kneelHeight: p.kneelHeight ?? 14, unitSprite: p.unitSprite, energyRecovery: p.energyRecovery };
  b.units.push(u); return u;
}
function freeSpawn(b: BattleState, list: Vec3[], rng: Rng, size: 1 | 2 = 1): Vec3 | null {
  const order = rng.shuffle([...list]);
  for (const p of order) { let ok = true; for (let dy = 0; dy < size && ok; dy++) for (let dx = 0; dx < size; dx++) { const t = tileAt(b, p.x + dx, p.y + dy, p.z); if (!t || (!t.floor && p.z > 0) || isBlockingObject(b, t) || unitAt(b, p.x + dx, p.y + dy, p.z) || (dx > 0 && t.wallW) || (dy > 0 && t.wallN)) { ok = false; break; } } if (ok) return p; }
  return null;
}
export function createBattle(setup: BattleSetup, roster: Soldier[], base?: Base): BattleState {
  const rng = new Rng(setup.seed);
  const map = makeMap(setup, rng, base);
  const b: BattleState = { setup, map, units: [], items: [], turn: 1, side: 'xcom', nextUid: 1, selectedUid: null, reserve: 'none', log: [], ended: null, rngState: rng.state, tally: { alienKilled: 0, alienStunned: 0, xcomDead: 0, xcomStunned: 0, civSaved: 0, civKilledXcom: 0, civKilledAlien: 0, shotsFired: 0, hits: 0 }, stage: setup.missionType === 'cydonia-brain' ? 2 : 1 };
  uidCounter = 1;
  // X-COM soldiers
  const spawns = [...map.spawnXcom];
  for (const sid of setup.soldierIds) {
    const s = roster.find((x) => x.id === sid); if (!s) continue;
    const armour = s.armour ? ITEMS[s.armour]?.armour : undefined;
    const p = freeSpawn(b, spawns, rng) ?? spawns[0]; if (!p) break;
    const u = makeUnit(b, { name: s.name, faction: 'xcom', stats: { ...s.stats }, armour: armour ? { ...armour.values } : { front: 0, left: 0, right: 0, rear: 0, under: 0 }, damageMod: armour ? { ...armour.damageMod } : {}, pos: p, facing: 0, soldierId: s.id, flying: !!armour?.flying, unitSprite: armour?.unitSprite ?? 'xcom-none', armourDef: s.armour ?? undefined, rank: s.rank });
    const lo = setup.loadouts[s.id] ?? s.equipment;
    for (const e of lo) newItem(b, e.def, u, e.slot, e.gx ?? 0, e.gy ?? 0, e.ammo, (e as any).rounds);
    if (!lo.length && setup.equipment['rifle'] > 0) { newItem(b, 'rifle', u, 'rightHand', 0, 0, 'rifle-clip'); setup.equipment['rifle']--; if (setup.equipment['rifle-clip'] > 0) { newItem(b, 'rifle-clip', u, 'belt', 0, 0); setup.equipment['rifle-clip']--; } if ((setup.equipment['grenade'] ?? 0) > 0) { newItem(b, 'grenade', u, 'belt', 1, 0); setup.equipment['grenade']--; } }
  }
  for (const h of setup.hwpItems ?? []) { const d = ITEMS[h]?.hwp; if (!d) continue; const p = freeSpawn(b, spawns, rng, 2); if (!p) break; const u = makeUnit(b, { name: ITEMS[h].name, faction: 'xcom', stats: d.stats, armour: d.armour, damageMod: d.damageMod, pos: p, facing: 0, size: 2, hwp: h, flying: d.flying, standHeight: 16, kneelHeight: 16, unitSprite: d.unitSprite }); newItem(b, d.weapon, u, 'rightHand', 0, 0, d.ammoItem, d.ammoRounds || undefined); }
  // craft equipment on the ground at the spawn
  const groundTile = spawns[Math.floor(spawns.length / 2)] ?? { x: 1, y: 1, z: 0 };
  for (const [id, n] of Object.entries(setup.equipment)) for (let i = 0; i < n; i++) { const it = newItem(b, id); it.tile = { ...groundTile }; if (ITEMS[id]?.ammo?.length) it.rounds = 0; }
  // Aliens
  const band = MISSION_SCHEDULE.bandOfMonth(setup.month); const diff = setup.difficulty;
  const race = ALIENS[setup.alienRace] ?? ALIENS['sectoid'];
  const crewOf = (): Partial<Record<AlienRank, number>> => { if (setup.alienCrew) return setup.alienCrew; if (setup.ufoType) { const c = UFOS[setup.ufoType].crew; const out: Partial<Record<AlienRank, number>> = {}; for (const k of Object.keys(c) as AlienRank[]) out[k] = c[k][diff]; return out; } return { soldier: 6 + diff * 2, navigator: 2, engineer: 1, leader: 1, commander: setup.missionType === 'alien-base' || setup.missionType.startsWith('cydonia') ? 1 : 0, terrorist: setup.missionType === 'terror' ? 3 + diff : 2 }; };
  const crew = crewOf(); const alienSpawns = [...map.spawnAlien];
  const scale = DIFFICULTY_ALIEN_STAT_SCALE;
  const spawnAlien = (raceId: string, rank: AlienRank) => {
    const rd = ALIENS[raceId]; const rk = rd?.ranks[rank] ?? rd?.ranks.soldier ?? rd?.ranks.terrorist; if (!rd || !rk) return;
    const size: 1 | 2 = rd.big ? 2 : 1; const p = freeSpawn(b, alienSpawns, rng, size); if (!p) return;
    const stats: UnitStats = { ...rk.stats, firing: Math.round(rk.stats.firing * scale.firing[diff]), health: Math.round(rk.stats.health * scale.health[diff]) };
    const armour = { front: Math.round(rk.armour.front * scale.armour[diff]), left: Math.round(rk.armour.left * scale.armour[diff]), right: Math.round(rk.armour.right * scale.armour[diff]), rear: Math.round(rk.armour.rear * scale.armour[diff]), under: Math.round(rk.armour.under * scale.armour[diff]) };
    const u = makeUnit(b, { name: `${rd.name}${rank === 'terrorist' ? '' : ' ' + rank.charAt(0).toUpperCase() + rank.slice(1)}`, faction: 'alien', stats, armour, damageMod: { ...rd.damageMod }, pos: p, facing: rng.int(0, 7) as Facing, size, race: raceId, rank, flying: rd.flying, standHeight: rk.standHeight, kneelHeight: rk.kneelHeight, unitSprite: rk.unitSprite, energyRecovery: rk.energyRecovery ?? 20 });
    u.aiState = { aggression: rk.aggression, intelligence: rk.intelligence };
    const set = rk.weaponSets[band] ?? []; let hand = false; let gx = 0;
    for (const id of set) { const d = ITEMS[id]; if (!d) continue; if (d.category === 'weapon' && !hand) { newItem(b, id, u, 'rightHand', 0, 0, d.ammo?.[0], d.ammo ? ITEMS[d.ammo[0]]?.clipSize : d.clipSize); hand = true; } else if (d.category === 'ammo') { newItem(b, id, u, 'belt', gx++, 0); } else newItem(b, id, u, 'belt', gx++, 0); }
  };
  for (const [rank, n] of Object.entries(crew) as [AlienRank, number][]) { for (let i = 0; i < (n ?? 0); i++) { if (rank === 'terrorist') spawnAlien(race.terrorUnits[i % Math.max(1, race.terrorUnits.length)] ?? 'reaper', 'terrorist'); else spawnAlien(race.id, race.ranks[rank] ? rank : 'soldier'); } }
  // Civilians
  if (setup.missionType === 'terror') { const civSpawns = [...map.spawnCivilian]; const n = rng.int(10, 16); for (let i = 0; i < n; i++) { const p = freeSpawn(b, civSpawns, rng); if (!p) break; const f = rng.percent(50); makeUnit(b, { name: `${rng.pick(f ? NAMES_F : NAMES_M)} ${rng.pick(NAMES_LAST)}`, faction: 'civilian', stats: { tu: 35, stamina: 60, health: 30, bravery: 40, reactions: 30, firing: 0, throwing: 0, strength: 20, psiStrength: 30, psiSkill: 0, melee: 0 }, armour: { front: 0, left: 0, right: 0, rear: 0, under: 0 }, damageMod: {}, pos: p, facing: rng.int(0, 7) as Facing, unitSprite: f ? 'civilian-f' : 'civilian-m' }); } }
  b.rngState = rng.state;
  b.selectedUid = unitsOf(b, 'xcom')[0]?.uid ?? null;
  updateAllVision(b);
  b.log.push({ turn: 1, side: 'xcom', text: 'Mission start', kind: 'system' });
  return b;
}

// ---------- Vision ----------
export const carriedWeight = (b: BattleState, u: BattleUnit) => weightOf(u.items.map((id) => itemByUid(b, id)).filter(Boolean).map((i) => ({ weight: ITEMS[i!.def]?.weight ?? 0, ammoWeight: i!.ammo ? ITEMS[i!.ammo]?.weight ?? 0 : 0 })));
export function recoverTurn(b: BattleState, u: BattleUnit) {
  const weight = carriedWeight(b, u); let tu = u.stats.tu;
  if (weight > u.stats.strength && weight > 0) tu = Math.floor((tu * u.stats.strength) / weight);
  tu -= Math.floor((tu * (u.wounds.leftLeg + u.wounds.rightLeg) * 10) / 100);
  u.tu = Math.max(0, tu);
  if (!isOut(u)) { let en = u.faction === 'xcom' && !u.hwp ? Math.floor(u.stats.tu / 3) : (u.energyRecovery ?? 20); en -= Math.floor((en * u.wounds.torso * 10) / 100); u.energy = Math.min(u.stats.stamina, u.energy + en); }
}
export function lightAt(b: BattleState, x: number, y: number, z: number) { const t = tileAt(b, x, y, z); return t ? Math.max(b.map.ambientLight, t.light) : 0; }
function inArc(u: BattleUnit, dx: number, dy: number) { if (dx === 0 && dy === 0) return true; const fx = FACING_DX[u.facing], fy = FACING_DY[u.facing]; if (u.facing % 2 === 0) return dx * fx + dy * fy >= 0; return (dx === 0 || Math.sign(dx) === fx) && (dy === 0 || Math.sign(dy) === fy); }
export function eyeVoxel(u: BattleUnit): Vec3 { const h = u.kneeling ? u.kneelHeight : u.standHeight; return { x: u.pos.x * VT + (u.size === 2 ? VT : VT / 2), y: u.pos.y * VT + (u.size === 2 ? VT : VT / 2), z: u.pos.z * VL + h - 2 }; }
export interface LofHit { kind: 'unit' | 'wall' | 'object' | 'floor' | 'none'; pos: Vec3; unit?: BattleUnit; tile?: Vec3; part?: 'wallN' | 'wallW' | 'object' | 'floor' }
/** Trace a voxel ray; returns the first obstruction. `ignore` = the shooter. */
export function lineOfFire(b: BattleState, from: Vec3, to: Vec3, ignore?: BattleUnit, forVision = false): LofHit {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z; const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz), 1);
  let lastTile = { x: -1, y: -1, z: -1 }; let smoke = 0;
  for (let i = 1; i <= steps; i++) {
    const vx = from.x + (dx * i) / steps, vy = from.y + (dy * i) / steps, vz = from.z + (dz * i) / steps;
    const tx = Math.floor(vx / VT), ty = Math.floor(vy / VT), tz = Math.floor(vz / VL); if (vz < 0) return { kind: 'floor', pos: { x: vx, y: vy, z: 0 }, tile: { x: tx, y: ty, z: 0 }, part: 'floor' };
    const t = tileAt(b, tx, ty, tz); if (!t) return { kind: 'none', pos: { x: vx, y: vy, z: vz } };
    const lx = vx - tx * VT, ly = vy - ty * VT, lz = vz - tz * VL;
    const entered = tx !== lastTile.x || ty !== lastTile.y || tz !== lastTile.z;
    if (entered) { if (forVision && t.smoke > 0) { smoke += t.smoke; if (smoke >= 6) return { kind: 'wall', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz } }; } if (lastTile.z >= 0 && tz > lastTile.z && t.floor && !forVision) return { kind: 'floor', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz }, part: 'floor' }; if (lastTile.z >= 0 && tz < lastTile.z) { const above = tileAt(b, tx, ty, tz + 1); if (above?.floor && tz + 1 > 0) return { kind: 'floor', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz + 1 }, part: 'floor' }; } lastTile = { x: tx, y: ty, z: tz }; }
    if (t.wallN && ly < 2 && lz < partHeight(b, t, 'wallN') && (forVision ? blocksVisionPart(b, t, 'wallN') : !(tileDefOf(b, t.wallN)?.door && t.doorOpen))) return { kind: 'wall', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz }, part: 'wallN' };
    if (t.wallW && lx < 2 && lz < partHeight(b, t, 'wallW') && (forVision ? blocksVisionPart(b, t, 'wallW') : !(tileDefOf(b, t.wallW)?.door && t.doorOpen))) return { kind: 'wall', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz }, part: 'wallW' };
    if (t.object && lx >= 4 && lx < 12 && ly >= 4 && ly < 12 && lz < partHeight(b, t, 'object') && (forVision ? blocksVisionPart(b, t, 'object') : !tileDefOf(b, t.object)?.lift)) return { kind: 'object', pos: { x: vx, y: vy, z: vz }, tile: { x: tx, y: ty, z: tz }, part: 'object' };
    const u = unitAt(b, tx, ty, tz);
    if (u && u !== ignore && !isOut(u) && i > 2) { const cx = u.pos.x * VT + (u.size === 2 ? VT : VT / 2), cy = u.pos.y * VT + (u.size === 2 ? VT : VT / 2); const r = u.size === 2 ? 14 : 6; const h = u.kneeling ? u.kneelHeight : u.standHeight; if ((vx - cx) ** 2 + (vy - cy) ** 2 <= r * r && vz >= u.pos.z * VL && vz < u.pos.z * VL + h) return { kind: 'unit', pos: { x: vx, y: vy, z: vz }, unit: u, tile: { ...u.pos } }; }
  }
  return { kind: 'none', pos: { ...to } };
}
export function canSeeTile(b: BattleState, u: BattleUnit, x: number, y: number, z: number): boolean {
  const dx = x - u.pos.x, dy = y - u.pos.y; const dist = Math.sqrt(dx * dx + dy * dy + (z - u.pos.z) ** 2 * 4);
  const lit = lightAt(b, x, y, z) >= 8; const range = b.map.night && !lit ? SIGHT_NIGHT : SIGHT_DAY;
  if (dist > range) return false; if (!inArc(u, dx, dy)) return false;
  const eye = eyeVoxel(u); const target = { x: x * VT + VT / 2, y: y * VT + VT / 2, z: z * VL + 10 };
  const hit = lineOfFire(b, eye, target, u, true);
  if (hit.kind === 'none') return true;
  if (hit.tile && hit.tile.x === x && hit.tile.y === y && hit.tile.z === z) return true;
  return false;
}
export function canSee(b: BattleState, u: BattleUnit, target: BattleUnit): boolean {
  if (isOut(target)) return false;
  for (let dy = 0; dy < target.size; dy++) for (let dx = 0; dx < target.size; dx++) if (canSeeTile(b, u, target.pos.x + dx, target.pos.y + dy, target.pos.z)) return true;
  return false;
}
export function updateVision(b: BattleState, u: BattleUnit): number[] {
  const newly: number[] = []; if (isOut(u)) { u.visibleUnits = []; return newly; }
  const prev = new Set(u.visibleUnits); u.visibleUnits = [];
  for (const o of b.units) { if (o === u || isOut(o) || o.faction === u.faction) continue; if (canSee(b, u, o)) { u.visibleUnits.push(o.uid); if (!o.visibleTo.includes(u.uid)) o.visibleTo.push(u.uid); if (u.faction === 'xcom') { if (!o.spotted) o.spotted = true; } if (u.faction === 'alien' && o.faction === 'xcom') o.turnsSinceSeen = 0; if (!prev.has(o.uid) && (u.faction === 'xcom' ? o.faction === 'alien' : o.faction === 'xcom')) newly.push(o.uid); } else { o.visibleTo = o.visibleTo.filter((id) => id !== u.uid); } }
  if (u.faction === 'xcom') { const range = SIGHT_DAY; for (let dy = -range; dy <= range; dy++) for (let dx = -range; dx <= range; dx++) { const x = u.pos.x + dx, y = u.pos.y + dy; for (let z = 0; z < b.map.levels; z++) { const t = tileAt(b, x, y, z); if (!t || (!t.floor && !t.wallN && !t.wallW && !t.object)) continue; if (canSeeTile(b, u, x, y, z)) { t.seen = true; t.visible = true; } } } }
  return newly;
}
export function updateAllVision(b: BattleState) {
  for (const t of b.map.tiles) t.visible = false;
  for (const u of b.units) u.visibleTo = [];
  // light from flares / fires
  for (const t of b.map.tiles) t.light = 0;
  const lights: { p: Vec3; r: number }[] = [];
  for (const it of b.items) if (it.tile && it.def === 'electro-flare' && it.fuse !== 0 && it.primed !== -2) lights.push({ p: it.tile, r: 8 });
  b.map.tiles.forEach((t, i) => { if (t.fire > 0) lights.push({ p: { x: i % b.map.w, y: Math.floor(i / b.map.w) % b.map.h, z: Math.floor(i / (b.map.w * b.map.h)) }, r: 4 }); });
  for (const l of lights) for (let dy = -l.r; dy <= l.r; dy++) for (let dx = -l.r; dx <= l.r; dx++) { const t = tileAt(b, l.p.x + dx, l.p.y + dy, l.p.z); if (t) t.light = Math.max(t.light, 15 - Math.floor((Math.sqrt(dx * dx + dy * dy) * 15) / (l.r + 1))); }
  for (const u of b.units) updateVision(b, u);
  // aliens and civilians only reveal by being in a visible tile
  for (const u of b.units) if (u.faction !== 'xcom' && !isOut(u)) { const t = tileAt(b, u.pos.x, u.pos.y, u.pos.z); if (t?.visible) { u.spotted = true; } }
}
export const visibleTiles = (b: BattleState, u: BattleUnit) => { const out: Vec3[] = []; for (let z = 0; z < b.map.levels; z++) for (let y = 0; y < b.map.h; y++) for (let x = 0; x < b.map.w; x++) if (canSeeTile(b, u, x, y, z)) out.push({ x, y, z }); return out; };

// ---------- Pathfinding ----------
export function stepBlocked(b: BattleState, u: BattleUnit, from: Vec3, to: Vec3): boolean {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (to.z !== from.z) { const a = tileAt(b, from.x, from.y, from.z), t = tileAt(b, to.x, to.y, to.z); if (!a || !t) return true; if (u.flying) return !!(isBlockingObject(b, t)) || (to.z > from.z && !!t.floor && !tileDefOf(b, t.floor)?.lift); const liftA = (a.floor && tileDefOf(b, a.floor)?.lift) || (a.object && tileDefOf(b, a.object)?.lift); const liftT = (t.floor && tileDefOf(b, t.floor)?.lift) || (t.object && tileDefOf(b, t.object)?.lift); return !(liftA || liftT); }
  const A = tileAt(b, from.x, from.y, from.z), B = tileAt(b, to.x, to.y, to.z); if (!A || !B) return true;
  if (!B.floor && to.z > 0 && !u.flying) return true;
  const wallBetween = (ax: number, ay: number, bx: number, by: number) => { const a = tileAt(b, ax, ay, from.z)!, bb = tileAt(b, bx, by, from.z)!; const ddx = bx - ax, ddy = by - ay; if (ddy === -1 && a.wallN && !(tileDefOf(b, a.wallN)?.door)) return true; if (ddy === 1 && bb.wallN && !(tileDefOf(b, bb.wallN)?.door)) return true; if (ddx === -1 && a.wallW && !(tileDefOf(b, a.wallW)?.door)) return true; if (ddx === 1 && bb.wallW && !(tileDefOf(b, bb.wallW)?.door)) return true; return false; };
  if (dx !== 0 && dy !== 0) { const c1 = tileAt(b, from.x + dx, from.y, from.z), c2 = tileAt(b, from.x, from.y + dy, from.z); if (!c1 || !c2) return true; if (wallBetween(from.x, from.y, from.x + dx, from.y) || wallBetween(from.x, from.y, from.x, from.y + dy) || wallBetween(from.x + dx, from.y, to.x, to.y) || wallBetween(from.x, from.y + dy, to.x, to.y)) return true; if (isBlockingObject(b, c1) || isBlockingObject(b, c2)) return true; }
  else if (wallBetween(from.x, from.y, to.x, to.y)) return true;
  if (isBlockingObject(b, B)) return true;
  if (u.size === 2) { for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const t = tileAt(b, to.x + xx, to.y + yy, to.z); if (!t || isBlockingObject(b, t) || (xx > 0 && t.wallW) || (yy > 0 && t.wallN)) return true; const o = unitAt(b, to.x + xx, to.y + yy, to.z); if (o && o !== u) return true; } }
  return false;
}
export function stepCost(b: BattleState, u: BattleUnit, from: Vec3, to: Vec3): { tu: number; energy: number } {
  const B = tileAt(b, to.x, to.y, to.z)!; const fd = tileDefOf(b, B.floor); let tu = fd?.tuCost ?? 4;
  const od = tileDefOf(b, B.object); if (od && od.tuCost > tu) tu = od.tuCost;
  if (to.z !== from.z) tu = Math.max(tu, 6);
  if (from.x !== to.x && from.y !== to.y) tu = Math.floor(tu * 1.5);
  const doorN = from.y > to.y ? tileAt(b, from.x, from.y, from.z)?.wallN : from.y < to.y ? B.wallN : null; const doorW = from.x > to.x ? tileAt(b, from.x, from.y, from.z)?.wallW : from.x < to.x ? B.wallW : null;
  if ((doorN && tileDefOf(b, doorN)?.door) || (doorW && tileDefOf(b, doorW)?.door)) tu += 2;
  if (u.flying) tu = Math.max(tu, 4);
  return { tu, energy: u.flying || u.hwp ? 0 : Math.floor(tu / 2) };
}
export function pathTo(b: BattleState, u: BattleUnit, target: Vec3, maxNodes = 6000): { path: Vec3[]; tu: number; energy: number; steps: { tu: number; energy: number }[] } | null {
  const key = (p: Vec3) => (p.z * b.map.h + p.y) * b.map.w + p.x;
  const start = u.pos; if (start.x === target.x && start.y === target.y && start.z === target.z) return { path: [], tu: 0, energy: 0, steps: [] };
  if (!inMap(b.map, target.x, target.y, target.z)) return null;
  const tt = tileAt(b, target.x, target.y, target.z)!; if (isBlockingObject(b, tt) || (!tt.floor && target.z > 0 && !u.flying)) return null; const occ = unitAt(b, target.x, target.y, target.z); if (occ && occ !== u) return null;
  const open: { p: Vec3; g: number; f: number }[] = [{ p: start, g: 0, f: 0 }]; const came = new Map<number, Vec3>(); const gScore = new Map<number, number>([[key(start), 0]]); const closed = new Set<number>(); let n = 0;
  const h = (p: Vec3) => Math.max(Math.abs(p.x - target.x), Math.abs(p.y - target.y)) * 4 + Math.abs(p.z - target.z) * 6;
  while (open.length && n++ < maxNodes) {
    open.sort((a, c) => a.f - c.f); const cur = open.shift()!; const ck = key(cur.p); if (closed.has(ck)) continue; closed.add(ck);
    if (cur.p.x === target.x && cur.p.y === target.y && cur.p.z === target.z) { const path: Vec3[] = []; let k = ck; let p: Vec3 | undefined = cur.p; while (p && !(p.x === start.x && p.y === start.y && p.z === start.z)) { path.unshift(p); p = came.get(k); if (p) k = key(p); } const steps = []; let tu = 0, en = 0, prev = start; for (const q of path) { const c = stepCost(b, u, prev, q); steps.push(c); tu += c.tu; en += c.energy; prev = q; } return { path, tu, energy: en, steps }; }
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy && !dz) continue; if (dz !== 0 && (dx || dy)) continue;
      const np = { x: cur.p.x + dx, y: cur.p.y + dy, z: cur.p.z + dz }; if (!inMap(b.map, np.x, np.y, np.z)) continue; const nk = key(np); if (closed.has(nk)) continue;
      if (stepBlocked(b, u, cur.p, np)) continue; const o = unitAt(b, np.x, np.y, np.z); if (o && o !== u && !(np.x === target.x && np.y === target.y && np.z === target.z)) { if (o.faction === u.faction || (u.faction === 'xcom' ? o.spotted : true)) continue; }
      const g = cur.g + stepCost(b, u, cur.p, np).tu; if (g < (gScore.get(nk) ?? Infinity)) { gScore.set(nk, g); came.set(nk, cur.p); open.push({ p: np, g, f: g + h(np) }); }
    }
  }
  return null;
}

// ---------- Movement and turns ----------
export const facingTo = (from: Vec3, to: Vec3): Facing => { const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y); for (let f = 0; f < 8; f++) if (FACING_DX[f] === dx && FACING_DY[f] === dy) return f as Facing; return from ? 0 : 0; };
export const turnCost = (from: Facing, to: Facing) => { const d = Math.abs(from - to) % 8; return Math.min(d, 8 - d) * TURN_TU; };
export interface StepResult { ok: boolean; reason?: string; spotted: number[]; reactions: any[]; door?: boolean; fell?: boolean; proximity?: boolean }
let combatHooks: { reactionCheck?: (b: BattleState, u: BattleUnit) => any[]; checkProximity?: (b: BattleState, u: BattleUnit, p: Vec3) => boolean; startOfTurn?: (b: BattleState, side: Faction) => any[]; endOfTurn?: (b: BattleState, side: Faction) => void } = {};
export const registerCombatHooks = (h: typeof combatHooks) => { combatHooks = { ...combatHooks, ...h }; };
export function turnUnit(b: BattleState, u: BattleUnit, facing: Facing): StepResult {
  const cost = turnCost(u.facing, facing); if (cost === 0) return { ok: true, spotted: [], reactions: [] };
  if (u.tu < cost) return { ok: false, reason: 'NOT ENOUGH TIME UNITS', spotted: [], reactions: [] };
  u.tu -= cost; u.facing = facing; const spotted = updateVision(b, u); const reactions = combatHooks.reactionCheck?.(b, u) ?? [];
  return { ok: true, spotted, reactions };
}
export function stepUnit(b: BattleState, u: BattleUnit, next: Vec3): StepResult {
  if (isOut(u) || u.status === 'panicking') return { ok: false, reason: 'UNIT CANNOT ACT', spotted: [], reactions: [] };
  if (stepBlocked(b, u, u.pos, next)) return { ok: false, reason: 'BLOCKED', spotted: [], reactions: [] };
  const occ = unitAt(b, next.x, next.y, next.z); if (occ && occ !== u) return { ok: false, reason: 'TILE OCCUPIED', spotted: [], reactions: [] };
  const f = next.z === u.pos.z ? facingTo(u.pos, next) : u.facing; const tc = turnCost(u.facing, f); const c = stepCost(b, u, u.pos, next);
  if (u.tu < tc + c.tu) return { ok: false, reason: 'NOT ENOUGH TIME UNITS', spotted: [], reactions: [] };
  if (u.energy < c.energy) return { ok: false, reason: 'NOT ENOUGH ENERGY', spotted: [], reactions: [] };
  let spotted: number[] = []; let reactions: any[] = [];
  if (tc > 0) { u.tu -= tc; u.facing = f; spotted.push(...updateVision(b, u)); reactions.push(...(combatHooks.reactionCheck?.(b, u) ?? [])); if (isOut(u)) return { ok: true, spotted, reactions }; if (spotted.length && u.faction === 'xcom') return { ok: true, spotted, reactions }; }
  let door = false;
  const openDoorPart = (t: Tile | null, part: 'wallN' | 'wallW') => { if (!t || !t[part]) return; const d = tileDefOf(b, t[part]); if (d?.door && !t.doorOpen) { t.doorOpen = true; door = true; if (d.door === 'ufo') t.ufoDoorOpen = true; } };
  const A = tileAt(b, u.pos.x, u.pos.y, u.pos.z), B = tileAt(b, next.x, next.y, next.z);
  if (next.y < u.pos.y) openDoorPart(A, 'wallN'); if (next.y > u.pos.y) openDoorPart(B, 'wallN'); if (next.x < u.pos.x) openDoorPart(A, 'wallW'); if (next.x > u.pos.x) openDoorPart(B, 'wallW');
  u.tu -= c.tu; u.energy -= c.energy; u.pos = { ...next }; if (u.kneeling) { u.kneeling = false; }
  if (B && B.fire > 0 && !u.flying) { u.fire = Math.max(u.fire, 2); }
  spotted.push(...updateVision(b, u));
  for (const o of b.units) if (o !== u && !isOut(o) && o.faction !== u.faction) { const before = o.visibleUnits.includes(u.uid); if (canSee(b, o, u)) { if (!before) { o.visibleUnits.push(u.uid); if (!u.visibleTo.includes(o.uid)) u.visibleTo.push(o.uid); if (o.faction === 'xcom') u.spotted = true; if (o.faction === 'alien' && u.faction === 'xcom') u.turnsSinceSeen = 0; } } else if (before) { o.visibleUnits = o.visibleUnits.filter((id) => id !== u.uid); u.visibleTo = u.visibleTo.filter((id) => id !== o.uid); } }
  const t = tileAt(b, next.x, next.y, next.z); if (t) { t.seen = t.seen || u.faction === 'xcom'; if (u.faction === 'xcom') t.visible = true; }
  const proximity = combatHooks.checkProximity?.(b, u, next) ?? false;
  if (!isOut(u)) reactions.push(...(combatHooks.reactionCheck?.(b, u) ?? []));
  return { ok: true, spotted, reactions, door, proximity };
}
export function kneel(b: BattleState, u: BattleUnit): StepResult {
  if (u.hwp || u.size === 2 || u.flying) return { ok: false, reason: 'CANNOT KNEEL', spotted: [], reactions: [] };
  const cost = u.kneeling ? STAND_TU : KNEEL_TU; if (u.tu < cost) return { ok: false, reason: 'NOT ENOUGH TIME UNITS', spotted: [], reactions: [] };
  u.tu -= cost; u.kneeling = !u.kneeling; if (u.kneeling && u.energy > 0) u.energy -= 1; const spotted = updateVision(b, u);
  return { ok: true, spotted, reactions: [] };
}
export function openDoor(b: BattleState, p: Vec3, part: 'wallN' | 'wallW', open: boolean) { const t = tileAt(b, p.x, p.y, p.z); if (t && t[part]) { t.doorOpen = open; if (tileDefOf(b, t[part])?.door === 'ufo') t.ufoDoorOpen = open; } }
export function closeUfoDoors(b: BattleState) { b.map.tiles.forEach((t, i) => { if (t.ufoDoorOpen) { const x = i % b.map.w, y = Math.floor(i / b.map.w) % b.map.h, z = Math.floor(i / (b.map.w * b.map.h)); if (!unitAt(b, x, y, z) && !unitAt(b, x, y - 1, z) && !unitAt(b, x - 1, y, z)) { t.doorOpen = false; t.ufoDoorOpen = false; } } }); }
export function endTurn(b: BattleState): { side: Faction; turn: number; events: any[] } {
  if (b.ended) return { side: b.side, turn: b.turn, events: [] };
  combatHooks.endOfTurn?.(b, b.side);
  const order: Faction[] = ['xcom', 'alien', 'civilian'];
  let next = order[(order.indexOf(b.side) + 1) % 3];
  if (next === 'civilian' && !unitsOf(b, 'civilian').length) next = 'xcom';
  if (next === 'xcom') { b.turn++; closeUfoDoors(b); }
  b.side = next;
  for (const u of b.units) if (u.faction === 'alien' && !isOut(u)) u.turnsSinceSeen++;
  const events = combatHooks.startOfTurn?.(b, next) ?? [];
  updateAllVision(b);
  if (next === 'xcom') { const sel = unitsOf(b, 'xcom').find((u) => !isOut(u) && u.status !== 'panicking'); b.selectedUid = sel?.uid ?? null; }
  b.log.push({ turn: b.turn, side: next, text: `${next === 'xcom' ? 'X-COM' : next === 'alien' ? 'Alien' : 'Civilian'} turn ${b.turn}`, kind: 'system' });
  return { side: next, turn: b.turn, events };
}

// ---------- Items on the map ----------
export function occupiedIn(b: BattleState, u: BattleUnit, slot: InvSlot, exclude?: number): Set<string> { const occ = new Set<string>(); for (const id of u.items) { if (id === exclude) continue; const it = itemByUid(b, id)!; if (it.slot !== slot) continue; const d = ITEMS[it.def]; for (let y = 0; y < d.size.h; y++) for (let x = 0; x < d.size.w; x++) occ.add(`${(it.gx ?? 0) + x},${(it.gy ?? 0) + y}`); } return occ; }
export function moveItem(b: BattleState, u: BattleUnit, itemUid: number, slot: InvSlot, gx: number, gy: number, free = false): { ok: boolean; reason?: string; tu?: number } {
  const it = itemByUid(b, itemUid); if (!it) return { ok: false, reason: 'NO ITEM' }; const d = ITEMS[it.def];
  const from: InvSlot = it.owner === u.uid ? it.slot ?? 'ground' : 'ground';
  if (slot !== 'ground') { if ((slot === 'rightHand' || slot === 'leftHand')) { gx = 0; gy = 0; if (occupiedIn(b, u, slot, itemUid).size) return { ok: false, reason: 'HAND OCCUPIED' }; } else if (!fits(d, slot, gx, gy, occupiedIn(b, u, slot, itemUid))) return { ok: false, reason: 'DOES NOT FIT' }; }
  const tu = free ? 0 : TU_MOVE[from][slot]; if (u.tu < tu) return { ok: false, reason: 'NOT ENOUGH TIME UNITS' };
  u.tu -= tu;
  if (slot === 'ground') { it.owner = undefined; it.slot = 'ground'; it.tile = { ...u.pos }; u.items = u.items.filter((id) => id !== itemUid); }
  else { if (it.owner !== u.uid) { if (it.owner !== undefined) { const o = unitByUid(b, it.owner); if (o) o.items = o.items.filter((id) => id !== itemUid); } it.owner = u.uid; u.items.push(itemUid); } it.tile = undefined; it.slot = slot; it.gx = gx; it.gy = gy; }
  return { ok: true, tu };
}
export const dropItem = (b: BattleState, u: BattleUnit, itemUid: number) => moveItem(b, u, itemUid, 'ground', 0, 0);
export const pickUp = (b: BattleState, u: BattleUnit, itemUid: number, slot: InvSlot = 'rightHand') => { const it = itemByUid(b, itemUid); if (!it?.tile || it.tile.x !== u.pos.x || it.tile.y !== u.pos.y || it.tile.z !== u.pos.z) return { ok: false, reason: 'NOT HERE' }; return moveItem(b, u, itemUid, slot, 0, 0); };
export function loadClip(b: BattleState, u: BattleUnit, weaponUid: number, clipUid: number): { ok: boolean; reason?: string } {
  const w = itemByUid(b, weaponUid), c = itemByUid(b, clipUid); if (!w || !c) return { ok: false, reason: 'NO ITEM' };
  const wd = ITEMS[w.def]; if (!wd.ammo?.includes(c.def)) return { ok: false, reason: 'WRONG AMMUNITION' }; if (w.ammo) return { ok: false, reason: 'WEAPON LOADED' };
  if (u.tu < TU_LOAD) return { ok: false, reason: 'NOT ENOUGH TIME UNITS' }; u.tu -= TU_LOAD;
  w.ammo = c.def; w.rounds = c.rounds; b.items = b.items.filter((i) => i.uid !== clipUid); u.items = u.items.filter((id) => id !== clipUid); return { ok: true };
}
export function unloadClip(b: BattleState, u: BattleUnit, weaponUid: number): { ok: boolean; reason?: string } {
  const w = itemByUid(b, weaponUid); if (!w || !w.ammo) return { ok: false, reason: 'NOT LOADED' }; if (u.tu < TU_UNLOAD) return { ok: false, reason: 'NOT ENOUGH TIME UNITS' };
  const other: InvSlot = w.slot === 'rightHand' ? 'leftHand' : 'rightHand'; if (occupiedIn(b, u, other).size) return { ok: false, reason: 'OTHER HAND MUST BE EMPTY' };
  u.tu -= TU_UNLOAD; const clip = newItem(b, w.ammo, u, other, 0, 0); clip.rounds = w.rounds; w.ammo = undefined; w.rounds = 0; return { ok: true };
}
export function destroyTilePart(b: BattleState, p: Vec3, part: 'wallN' | 'wallW' | 'object' | 'floor'): boolean {
  const t = tileAt(b, p.x, p.y, p.z); if (!t || !t[part]) return false; const d = tileDefOf(b, t[part]);
  if (part === 'floor') { if (p.z === 0) { t.floor = 'crater'; return true; } t.floor = null; return true; }
  t[part] = d?.destroyedTo ?? null; if (part === 'object' && t.object === 'rubble' && d?.id === 'rubble') t.object = null; if (part !== 'object') t.doorOpen = false;
  return true;
}
export const handItem = (b: BattleState, u: BattleUnit, hand: 'rightHand' | 'leftHand' = 'rightHand') => u.items.map((id) => itemByUid(b, id)!).find((i) => i.slot === hand);
export const weaponInHands = (b: BattleState, u: BattleUnit) => { const r = handItem(b, u, 'rightHand'), l = handItem(b, u, 'leftHand'); const isW = (i?: BattleItem) => i && (ITEMS[i.def].battleType === 'firearm' || ITEMS[i.def].battleType === 'melee'); return isW(r) ? r : isW(l) ? l : undefined; };
export const spawnItemOnGround = (b: BattleState, def: string, p: Vec3) => { const it = newItem(b, def); it.tile = { ...p }; return it; };
