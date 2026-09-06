import type { TerrainSetDef, TerrainTileDef } from './types';
// Terrain tile definitions. Shapes are white masters from the atlas tinted with palette keys at runtime.
type Part = { shape: string; tint: string; dz?: number };
const tile = (id: string, parts: Part[], o: Partial<TerrainTileDef> = {}): TerrainTileDef => ({ id, parts, armour: 20, tuCost: 4, height: 0, flammability: 0, fuel: 0, ...o });
const floor = (id: string, tint: string, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape: 'shape/floor', tint }], { floor: true, ...o });
const rough = (id: string, tint: string, tuCost = 6, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape: 'shape/floor-rough', tint }], { floor: true, tuCost, ...o });
const wallN = (id: string, shape: string, tint: string, armour = 60, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape, tint }], { wallNorth: true, armour, height: 24, blocksVision: true, destroyedTo: undefined, ...o });
const wallW = (id: string, shape: string, tint: string, armour = 60, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape, tint }], { wallWest: true, armour, height: 24, blocksVision: true, ...o });
const obj = (id: string, shape: string, tint: string, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape, tint }], { object: true, armour: 30, height: 16, blocksVision: false, ...o });
const tree = (id: string, trunk: string, canopy: string, o: Partial<TerrainTileDef> = {}) => tile(id, [{ shape: 'shape/tree-trunk', tint: trunk }, { shape: 'shape/tree-canopy', tint: canopy, dz: 12 }], { object: true, armour: 40, height: 24, blocksVision: true, flammability: 40, fuel: 3, destroyedTo: 'rubble', ...o });
const common = (ground: string, groundShade: string): TerrainTileDef[] => [
  floor('floor', ground), rough('rough', groundShade), floor('road', 'asphalt', { tuCost: 3 }), tile('road-line', [{ shape: 'shape/floor', tint: 'asphalt' }, { shape: 'shape/road-line', tint: 'concrete' }], { floor: true, tuCost: 3 }),
  tile('crater', [{ shape: 'shape/crater', tint: 'scorch' }], { floor: true, tuCost: 6 }),
  obj('rubble', 'shape/rubble', 'debris', { tuCost: 8, armour: 20, height: 6 }),
  obj('rock', 'shape/rock', 'debris', { armour: 60, height: 12, blocksVision: true, destroyedTo: 'rubble' }),
  obj('bush', 'shape/bush', 'forestShade', { armour: 10, height: 10, blocksVision: true, flammability: 60, fuel: 2, tuCost: 5 }),
  wallN('fence-n', 'shape/fence-n', 'wood', 20, { height: 8, blocksVision: false, flammability: 60, fuel: 2 }), wallW('fence-w', 'shape/fence-w', 'wood', 20, { height: 8, blocksVision: false, flammability: 60, fuel: 2 }),
  wallN('hedge-n', 'shape/hedge-n', 'forestShade', 15, { height: 12, blocksVision: true, flammability: 60, fuel: 3 }), wallW('hedge-w', 'shape/hedge-w', 'forestShade', 15, { height: 12, blocksVision: true, flammability: 60, fuel: 3 }),
  wallN('wall-n', 'shape/wall-n', 'brick', 70), wallW('wall-w', 'shape/wall-w', 'brick', 70),
  wallN('wall-n-window', 'shape/wall-n-window', 'brick', 40, { blocksVision: false }), wallW('wall-w-window', 'shape/wall-w-window', 'brick', 40, { blocksVision: false }),
  wallN('door-n', 'shape/door-n', 'wood', 30, { door: 'normal', tuCost: 4 }), wallW('door-w', 'shape/door-w', 'wood', 30, { door: 'normal', tuCost: 4 }),
  wallN('half-wall-n', 'shape/half-wall-n', 'concrete', 50, { height: 12, blocksVision: false }), wallW('half-wall-w', 'shape/half-wall-w', 'concrete', 50, { height: 12, blocksVision: false }),
  floor('roof', 'roof', { armour: 40 }), floor('floor-wood', 'woodShade', { flammability: 30, fuel: 4 }), floor('floor-concrete', 'concrete'),
  obj('table', 'shape/table', 'wood', { armour: 20, height: 8, flammability: 50, fuel: 2 }), obj('chair', 'shape/chair', 'woodShade', { armour: 15, height: 8, flammability: 50, fuel: 1 }), obj('bed', 'shape/bed', 'coatShadow', { armour: 20, height: 8, flammability: 60, fuel: 3 }),
  obj('crate', 'shape/crate', 'wood', { armour: 30, height: 12, blocksVision: true, flammability: 50, fuel: 2, destroyedTo: 'rubble' }),
  obj('stairs-n', 'shape/stairs-n', 'concrete', { armour: 80, height: 24, lift: true, tuCost: 6 }), obj('stairs-w', 'shape/stairs-w', 'concrete', { armour: 80, height: 24, lift: true, tuCost: 6 }),
  obj('pillar', 'shape/pillar', 'concreteShade', { armour: 90, height: 24, blocksVision: true }), obj('lamp', 'shape/lamp', 'metalMid', { armour: 20, height: 24, blocksVision: false }),
  obj('car', 'shape/car', 'techAccentDeep', { armour: 40, height: 12, blocksVision: true, flammability: 80, fuel: 4, explosive: 60, destroyedTo: 'rubble' }),
  tile('lift', [{ shape: 'shape/lift', tint: 'concrete' }], { floor: true, lift: true }),
];
const ufoInterior: TerrainTileDef[] = [
  tile('ufo-floor', [{ shape: 'shape/ufo-floor', tint: 'ufoFloor' }], { floor: true, armour: 120 }),
  wallN('ufo-wall-n', 'shape/ufo-wall-n', 'ufoWall', 120), wallW('ufo-wall-w', 'shape/ufo-wall-w', 'ufoWall', 120),
  wallN('ufo-door-n', 'shape/ufo-door-n', 'ufoWallShade', 100, { door: 'ufo' }), wallW('ufo-door-w', 'shape/ufo-door-w', 'ufoWallShade', 100, { door: 'ufo' }),
  obj('nav-console', 'shape/nav-console', 'techAccentDeep', { armour: 60, height: 12, blocksVision: false, destroyedTo: 'rubble' }),
  obj('power-source', 'shape/power-source', 'coreField', { armour: 60, height: 16, blocksVision: true, explosive: 180, destroyedTo: 'rubble' }),
  obj('alien-pod', 'shape/alien-pod', 'alienOrganic', { armour: 40, height: 16, blocksVision: true }),
  obj('console', 'shape/console', 'techAccentDeep', { armour: 50, height: 10 }),
  tile('ufo-lift', [{ shape: 'shape/lift', tint: 'ufoFloor' }], { floor: true, lift: true, armour: 120 }),
];
const alienBase: TerrainTileDef[] = [
  tile('alien-floor', [{ shape: 'shape/alien-floor', tint: 'alienFloor' }], { floor: true, armour: 120 }),
  wallN('alien-wall-n', 'shape/alien-wall-n', 'alienWall', 130), wallW('alien-wall-w', 'shape/alien-wall-w', 'alienWall', 130),
  wallN('alien-door-n', 'shape/alien-door-n', 'alienWallShade', 100, { door: 'ufo' }), wallW('alien-door-w', 'shape/alien-door-w', 'alienWallShade', 100, { door: 'ufo' }),
  obj('control-console', 'shape/nav-console', 'coreEdge', { armour: 70, height: 12, destroyedTo: 'rubble' }),
  obj('power-source', 'shape/power-source', 'coreField', { armour: 60, height: 16, blocksVision: true, explosive: 180, destroyedTo: 'rubble' }),
  obj('alien-pod', 'shape/alien-pod', 'alienOrganic', { armour: 40, height: 16, blocksVision: true }),
  obj('brain', 'shape/power-source', 'alienOrganic', { armour: 150, height: 24, blocksVision: true, destroyedTo: 'rubble' }),
  tile('alien-lift', [{ shape: 'shape/lift', tint: 'alienFloor' }], { floor: true, lift: true, armour: 120 }),
  obj('rubble', 'shape/rubble', 'debris', { tuCost: 8, armour: 20, height: 6 }),
];
const xcomBase: TerrainTileDef[] = [
  tile('xcom-floor', [{ shape: 'shape/xcom-floor', tint: 'concrete' }], { floor: true, armour: 100 }),
  wallN('xcom-wall-n', 'shape/xcom-wall-n', 'concreteShade', 110), wallW('xcom-wall-w', 'shape/xcom-wall-w', 'concreteShade', 110),
  wallN('xcom-door-n', 'shape/xcom-door-n', 'metalMid', 80, { door: 'normal' }), wallW('xcom-door-w', 'shape/xcom-door-w', 'metalMid', 80, { door: 'normal' }),
  obj('console', 'shape/console', 'techAccentDeep', { armour: 50, height: 10 }), obj('crate', 'shape/crate', 'wood', { armour: 30, height: 12, blocksVision: true, destroyedTo: 'rubble' }),
  obj('bed', 'shape/bed', 'coatShadow', { armour: 20, height: 8 }), obj('table', 'shape/table', 'metalMid', { armour: 20, height: 8 }),
  tile('lift', [{ shape: 'shape/lift', tint: 'concrete' }], { floor: true, lift: true, armour: 100 }), obj('rubble', 'shape/rubble', 'debris', { tuCost: 8, armour: 20, height: 6 }),
];
const set = (id: string, name: string, ground: string, tiles: TerrainTileDef[]): TerrainSetDef => ({ id, name, ground, tiles });
export const TERRAIN_SETS: Record<string, TerrainSetDef> = {
  farm: set('farm', 'Farmland', 'grass', [...common('grass', 'grassShade'), floor('field', 'soil', { tuCost: 5 }), floor('field-crop', 'sandShade', { tuCost: 5, flammability: 40, fuel: 2 }), tree('tree', 'wood', 'forest'), wallN('barn-wall-n', 'shape/wall-n', 'woodShade', 40, { flammability: 40, fuel: 4 }), wallW('barn-wall-w', 'shape/wall-w', 'woodShade', 40, { flammability: 40, fuel: 4 })]),
  urban: set('urban', 'Urban', 'concrete', [...common('concrete', 'concreteShade'), floor('pavement', 'concreteShade', { tuCost: 3 }), tree('tree', 'wood', 'forest'), wallN('shop-n', 'shape/wall-n-window', 'roof', 40, { blocksVision: false }), wallW('shop-w', 'shape/wall-w-window', 'roof', 40, { blocksVision: false })]),
  forest: set('forest', 'Forest', 'forest', [...common('forestShade', 'forest'), tree('tree', 'woodShade', 'forest'), tree('tree-dark', 'woodShade', 'forestShade'), floor('leaf-litter', 'soilShade', { tuCost: 5, flammability: 30, fuel: 2 })]),
  desert: set('desert', 'Desert', 'sand', [...common('sand', 'sandShade'), obj('cactus', 'shape/cactus', 'grassShade', { armour: 15, height: 16, blocksVision: false }), rough('dune', 'sandShade', 6), obj('boulder', 'shape/rock', 'sandShade', { armour: 70, height: 14, blocksVision: true, destroyedTo: 'rubble' })]),
  jungle: set('jungle', 'Jungle', 'jungle', [...common('jungle', 'jungleShade'), tree('tree', 'woodShade', 'jungle'), tree('palm', 'wood', 'jungleShade'), obj('undergrowth', 'shape/bush', 'jungleShade', { armour: 10, height: 12, blocksVision: true, tuCost: 6, flammability: 50, fuel: 2 }), floor('mud', 'soilShade', { tuCost: 6 })]),
  polar: set('polar', 'Polar', 'snow', [...common('snow', 'snowShade'), obj('snowbank', 'shape/snowbank', 'snow', { armour: 10, height: 10, blocksVision: false, tuCost: 6 }), rough('ice', 'snowShade', 5), obj('ice-rock', 'shape/rock', 'snowShade', { armour: 60, height: 12, blocksVision: true, destroyedTo: 'rubble' })]),
  mountain: set('mountain', 'Mountain', 'debris', [...common('concreteShade', 'debris'), obj('boulder', 'shape/rock', 'debris', { armour: 80, height: 16, blocksVision: true, destroyedTo: 'rubble' }), rough('scree', 'debris', 7), tree('pine', 'woodShade', 'forestShade'), obj('ledge', 'shape/stairs-n', 'debris', { armour: 100, height: 24, lift: true, tuCost: 8 })]),
  'alien-base': set('alien-base', 'Alien Base', 'alienFloor', alienBase),
  'ufo-interior': set('ufo-interior', 'UFO Interior', 'ufoFloor', ufoInterior),
  'xcom-base': set('xcom-base', 'X-COM Base', 'concrete', xcomBase),
  'cydonia-surface': set('cydonia-surface', 'Cydonia Surface', 'brick', [...common('brick', 'brickShade'), obj('pyramid-block', 'shape/pillar', 'alienWall', { armour: 130, height: 24, blocksVision: true }), rough('mars-dust', 'brickShade', 5), tile('descent-lift', [{ shape: 'shape/lift', tint: 'alienFloor' }], { floor: true, lift: true, armour: 120 }), ...alienBase.filter((t) => t.id.startsWith('alien-'))]),
  'cydonia-brain': set('cydonia-brain', 'Cydonia Depths', 'alienFloor', alienBase),
};
export const terrainSet = (id: string) => TERRAIN_SETS[id];
export const tileDef = (setId: string, tileId: string): TerrainTileDef | undefined => TERRAIN_SETS[setId]?.tiles.find((t) => t.id === tileId);
/** Terrain set for a site by latitude / longitude band (the original picks by world texture). */
export function terrainFor(lon: number, lat: number, seed: number): string {
  const a = Math.abs(lat);
  if (a > 66) return 'polar';
  if (a < 20 && ((lon > -80 && lon < -35) || (lon > 95 && lon < 155) || (lon > 8 && lon < 40))) return 'jungle';
  if ((lat > 15 && lat < 35 && lon > -15 && lon < 60) || (lat > -35 && lat < -15 && lon > 110 && lon < 150) || (lat > 25 && lat < 40 && lon > -120 && lon < -100)) return 'desert';
  const r = (seed >>> 0) % 10;
  if (r < 4) return 'farm'; if (r < 7) return 'forest'; if (r < 9) return 'urban'; return 'mountain';
}
