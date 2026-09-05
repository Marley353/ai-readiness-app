export const TILE_W = 64, TILE_H = 32, LEVEL_H = 48, VOXELS_PER_TILE = 16, VOXELS_PER_LEVEL = 24;
/** Tile (x,y,z) → screen px at zoom 1 (centre of the tile's floor diamond). */
export const toScreen = (x: number, y: number, z: number) => ({ sx: (x - y) * (TILE_W / 2), sy: (x + y) * (TILE_H / 2) - z * LEVEL_H });
/** Screen px → fractional tile coords for a given level. */
export const fromScreen = (sx: number, sy: number, z: number) => { const yy = sy + z * LEVEL_H; return { x: (sx / (TILE_W / 2) + yy / (TILE_H / 2)) / 2, y: (yy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2 }; };
/** Draw order key: bigger = drawn later. Diagonal sweep with elevation. */
export const depth = (x: number, y: number, z: number, layer = 0) => (x + y) * 64 + z * 8 + layer;
export const FACING_DX = [0, 1, 1, 1, 0, -1, -1, -1] as const;  // 0=N (x=0,y=-1)... using the original: N = y-1
export const FACING_DY = [-1, -1, 0, 1, 1, 1, 0, -1] as const;
export const facingFromDelta = (dx: number, dy: number): number => { for (let f = 0; f < 8; f++) if (FACING_DX[f] === Math.sign(dx) && FACING_DY[f] === Math.sign(dy)) return f; return 0; };
/** Facings 5,6,7 render as mirrored 3,2,1. */
export const spriteFacing = (f: number): { facing: number; mirror: boolean } => (f <= 4 ? { facing: f, mirror: false } : { facing: 8 - f, mirror: true });
