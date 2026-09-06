// Tintable terrain masters (`shape/*`). White masters: lit faces #ffffff, single shading step #b3b3b3 on screen-left
// faces / undersides / recesses, separating edges #808080 at 1 unit. Tinted at runtime by multiplying with a palette
// colour (see docs/ASSETS.md).
//
// Geometry. Floors: 32×16, diamond 16,0 32,8 16,16 0,8. Walls: 32×40, the floor diamond occupies y 24..40; a wall is a
// slab 3 units thick standing on the diamond's north edge (16,24)-(32,32) (`*-n`) or west edge (0,32)-(16,24) (`*-w`),
// 24 units high (one level). Objects: 32×32 with the diamond at y 16..32. Straight-edged terrain polygons use
// shape-rendering="crispEdges" so adjacent tiles rasterise without anti-aliasing seams.
import { svg, poly, path, circle, ellipse, line, pts, W, SH, ED, F, isoAt } from './_lib.mjs';

const CRISP = { 'shape-rendering': 'crispEdges' };
const T = 3 / 16;   // wall thickness (3 screen units)
const H = 24;       // full wall height
const fl = isoAt(0);   // floors
const wl = isoAt(24);  // walls
const ob = isoAt(16);  // objects

const DIAMOND = [fl(0, 0), fl(1, 0), fl(1, 1), fl(0, 1)];
const floorBase = (fill = W) => poly(DIAMOND, fill, CRISP);
const floor = (body) => svg(32, 16, body);
const wall = (body) => svg(32, 40, body);
const object = (body) => svg(32, 32, body);

// ---------------------------------------------------------------------------------------------------------------
// Walls. `pt(a, d, z)`: a = fraction along the wall from the diamond's top vertex, d = depth into the tile (0..T),
// z = height. The main visible face sits at d = T, the end face at a = 1, the top cap at z = height.
function wallFrame(side) {
  const pt = side === 'n' ? (a, d, z) => wl(a, d, z) : (a, d, z) => wl(d, a, z);
  const main = side === 'n' ? W : SH;    // screen-right faces lit, screen-left faces shaded
  const dark = side === 'n' ? SH : ED;   // recess tone on that face
  return { pt, main, dark, side };
}

/** Slab with a flat top; `h` = height, `faceOverride` lets variants draw the main face themselves. */
function slab(fr, h, faceBody = null) {
  const { pt, main, side } = fr;
  const top = [pt(0, 0, h), pt(1, 0, h), pt(1, T, h), pt(0, T, h)];
  const face = [pt(0, T, 0), pt(1, T, 0), pt(1, T, h), pt(0, T, h)];
  const end = [pt(1, 0, 0), pt(1, T, 0), pt(1, T, h), pt(1, 0, h)];
  let s = poly(end, SH, CRISP) + (faceBody ?? poly(face, main, CRISP)) + poly(top, W, CRISP);
  if (side === 'n') s += line(pt(0, T, h), pt(1, T, h), ED);   // lit top meets lit face
  else s += line(pt(1, T, 0), pt(1, T, h), ED);                // shaded face meets shaded end
  return s;
}

const facePoly = (fr, a0, a1, z0, z1, d = T) => [fr.pt(a0, d, z0), fr.pt(a1, d, z0), fr.pt(a1, d, z1), fr.pt(a0, d, z1)];

/** Door panel: a recess (edge tone) with the panel inset one unit into the wall. */
function door(fr, a0 = 0.28, a1 = 0.72, h = 19, extra = '') {
  const opening = facePoly(fr, a0, a1, 0, h);
  const panel = facePoly(fr, a0 + 0.02, a1 - 0.02, 0, h - 1, T - 1 / 16);
  return poly(opening, ED, CRISP) + poly(panel, fr.dark, CRISP)
    + circle(...fr.pt(a1 - 0.1, T - 1 / 16, 9), 0.8, ED) + extra;
}

function plainWall(side, h = H) { return wall(slab(wallFrame(side), h)); }

function windowWall(side) {
  const fr = wallFrame(side);
  const face = facePoly(fr, 0, 1, 0, H);
  const hole = facePoly(fr, 0.28, 0.72, 9, 19);
  const faceBody = path(`M${pts(face)}ZM${pts(hole)}Z`, fr.main, { 'fill-rule': 'evenodd', ...CRISP })
    + poly(hole, 'none', { stroke: ED, 'stroke-width': 1, ...CRISP })
    + line(fr.pt(0.5, T, 9), fr.pt(0.5, T, 19), ED)
    + line(fr.pt(0.28, T, 14), fr.pt(0.72, T, 14), ED);
  return wall(slab(fr, H, faceBody));
}

function doorWall(side) {
  const fr = wallFrame(side);
  return wall(slab(fr, H) + door(fr));
}

function fence(side) {
  const fr = wallFrame(side);
  const { pt, main } = fr;
  const railTone = side === 'n' ? SH : W;
  const rail = (z) => poly([pt(0, T / 2, z), pt(1, T / 2, z), pt(1, T / 2, z + 1.5), pt(0, T / 2, z + 1.5)], railTone, CRISP);
  const post = (a) => poly([pt(a - 0.035, T / 2, 0), pt(a + 0.035, T / 2, 0), pt(a + 0.035, T / 2, 12), pt(a - 0.035, T / 2, 12)], main, CRISP);
  return wall(rail(4) + rail(8.5) + post(0.08) + post(0.5) + post(0.92));
}

function hedge(side) {
  const fr = wallFrame(side);
  const { pt } = fr;
  let s = poly([pt(0.05, T / 2, 0), pt(0.95, T / 2, 0), pt(0.95, T / 2, 6), pt(0.05, T / 2, 6)], SH, CRISP);
  for (const a of [0.2, 0.5, 0.8]) {
    const [cx, cy] = pt(a, T / 2, 5);
    s += ellipse(cx, cy, 4.6, 4.5, SH) + ellipse(cx + 1, cy - 1, 4, 3.9, W);
  }
  return wall(s);
}

/** UFO hull wall: chamfered top (reads as a curved hull) + horizontal seam. */
function ufoWallBody(fr, extra = '') {
  const { pt, main, side } = fr;
  const c = 6;
  const face = [pt(0, T, 0), pt(1, T, 0), pt(1, T, H - c), pt(0, T, H - c)];
  const chamfer = [pt(0, T, H - c), pt(1, T, H - c), pt(1, 0, H), pt(0, 0, H)];
  const end = [pt(1, 0, 0), pt(1, T, 0), pt(1, T, H - c), pt(1, 0, H)];
  let s = poly(end, SH, CRISP) + poly(face, main, CRISP) + poly(chamfer, W, CRISP);
  s += line(pt(0, T, H - c), pt(1, T, H - c), ED);
  s += line(pt(0, T, 10), pt(1, T, 10), ED);
  if (side === 'w') s += line(pt(1, T, 0), pt(1, T, H - c), ED);
  return s + extra;
}
const ufoWall = (side) => wall(ufoWallBody(wallFrame(side)));
function ufoDoor(side) {
  const fr = wallFrame(side);
  const split = line(fr.pt(0.2, T - 1 / 16, 8.5), fr.pt(0.8, T - 1 / 16, 8.5), ED);
  return wall(ufoWallBody(fr) + door(fr, 0.2, 0.8, 17, split));
}

/** Alien base wall: angular hexagonal panel inset in the face. */
function alienPanel(fr) {
  const { pt, dark } = fr;
  const hex = [pt(0.2, T, 7), pt(0.5, T, 4), pt(0.8, T, 7), pt(0.8, T, 17), pt(0.5, T, 20), pt(0.2, T, 17)];
  return poly(hex, dark, CRISP) + poly(hex, 'none', { stroke: ED, 'stroke-width': 1, ...CRISP });
}
const alienWall = (side) => { const fr = wallFrame(side); return wall(slab(fr, H) + alienPanel(fr)); };
function alienDoor(side) {
  const fr = wallFrame(side);
  const { pt, dark } = fr;
  const opening = [pt(0.24, T, 0), pt(0.76, T, 0), pt(0.76, T, 14), pt(0.5, T, 19), pt(0.24, T, 14)];
  const d = T - 1 / 16;
  const panel = [pt(0.26, d, 0), pt(0.74, d, 0), pt(0.74, d, 13.5), pt(0.5, d, 18), pt(0.26, d, 13.5)];
  return wall(slab(fr, H) + poly(opening, ED, CRISP) + poly(panel, dark, CRISP) + line(pt(0.5, d, 0), pt(0.5, d, 18), ED));
}

/** X-COM base wall: plain with a seam and a dark skirting. */
function xcomBody(fr) {
  const { pt, dark } = fr;
  return poly(facePoly(fr, 0, 1, 0, 3), dark, CRISP) + line(pt(0, T, 16), pt(1, T, 16), ED);
}
const xcomWall = (side) => { const fr = wallFrame(side); return wall(slab(fr, H) + xcomBody(fr)); };
function xcomDoor(side) {
  const fr = wallFrame(side);
  const win = poly(facePoly(fr, 0.42, 0.58, 12, 16, T - 1 / 16), W, CRISP);
  return wall(slab(fr, H) + xcomBody(fr) + door(fr, 0.28, 0.72, 19, win));
}

// ---------------------------------------------------------------------------------------------------------------
// Objects (32×32, diamond at y 16..32).
function box(u0, v0, u1, v1, z0, z1, o = {}) {
  const P = ob;
  const top = [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)];
  const left = [P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)];
  const right = [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)];
  let s = poly(left, o.left ?? SH, CRISP) + poly(right, o.right ?? W, CRISP) + poly(top, o.top ?? W, CRISP);
  if (o.edge !== false) s += line(P(u1, v0, z1), P(u1, v1, z1), ED);
  return s;
}
/** Soft blob: shaded ellipse with a lit ellipse offset to the upper right (flat two-tone). */
const blob = (cx, cy, rx, ry, k = 1) => ellipse(cx, cy, rx, ry, SH) + ellipse(cx + k, cy - k, rx - k * 0.6, ry - k * 0.6, W);

const objects = {
  pillar: () => box(0.35, 0.35, 0.65, 0.65, 0, 20),
  crate: () => {
    const P = ob;
    return box(0.2, 0.2, 0.8, 0.8, 0, 9)
      + line(P(0.2, 0.8, 4.5), P(0.8, 0.8, 4.5), ED) + line(P(0.8, 0.8, 4.5), P(0.8, 0.2, 4.5), ED)
      + line(P(0.35, 0.35, 9), P(0.65, 0.65, 9), ED);
  },
  rock: () => {
    const lit = [[16, 10], [24, 12], [28, 20], [24, 26], [16, 27], [15, 19]];
    const shade = [[16, 10], [15, 19], [16, 27], [9, 27], [4, 22], [7, 14]];
    return poly(shade, SH) + poly(lit, W) + ellipse(16, 27, 12, 3, SH);
  },
  bush: () => blob(11, 24, 6, 5, 1.2) + blob(21, 25, 6.5, 5.5, 1.2) + blob(16, 19, 6.5, 6, 1.4),
  'tree-trunk': () => {
    const P = ob;
    return box(0.42, 0.42, 0.58, 0.58, 0, 15, { edge: false })
      + poly([P(0.42, 0.58, 0), P(0.35, 0.66, 0), P(0.42, 0.58, 2)], SH, CRISP)
      + poly([P(0.58, 0.42, 0), P(0.66, 0.35, 0), P(0.58, 0.42, 2)], W, CRISP);
  },
  'tree-canopy': () => blob(10, 12, 6, 5.5, 1.3) + blob(22, 12, 6, 5.5, 1.3) + blob(16, 7, 6.5, 6, 1.4) + blob(16, 13, 7.5, 6.5, 1.5),
  cactus: () => {
    const arm = (x, y, h, dir) => `<rect x="${F(dir < 0 ? x - 6 : x)}" y="${F(y)}" width="6.5" height="2.6" rx="1.3" fill="${W}"/>`
      + `<rect x="${F(dir < 0 ? x - 6 : x + 4)}" y="${F(y - h)}" width="2.6" height="${F(h + 2.6)}" rx="1.3" fill="${W}"/>`
      + `<rect x="${F(dir < 0 ? x - 6 : x + 4)}" y="${F(y - h)}" width="1" height="${F(h + 2)}" fill="${SH}"/>`;
    return ellipse(16, 25, 5, 2.2, SH)
      + `<rect x="14" y="3" width="4.4" height="23" rx="2.2" fill="${W}"/>` + `<rect x="14" y="4" width="1.4" height="21" fill="${SH}"/>`
      + arm(14, 12, 6, -1) + arm(18, 15, 5, 1);
  },
  snowbank: () => ellipse(16, 24, 14, 6, SH) + ellipse(17, 23, 12.5, 5.2, W) + ellipse(20, 21.5, 6, 2.5, W),
  table: () => {
    const leg = (u, v) => box(u - 0.04, v - 0.04, u + 0.04, v + 0.04, 0, 7, { edge: false });
    return leg(0.22, 0.22) + leg(0.78, 0.22) + leg(0.22, 0.78) + leg(0.78, 0.78) + box(0.15, 0.15, 0.85, 0.85, 7, 9);
  },
  chair: () => {
    const leg = (u, v) => box(u - 0.03, v - 0.03, u + 0.03, v + 0.03, 0, 5, { edge: false });
    return leg(0.34, 0.34) + leg(0.66, 0.34) + leg(0.34, 0.66) + leg(0.66, 0.66)
      + box(0.3, 0.3, 0.7, 0.7, 5, 7) + box(0.3, 0.3, 0.36, 0.7, 7, 15, { edge: false });
  },
  bed: () => box(0.1, 0.28, 0.9, 0.72, 0, 5) + box(0.14, 0.32, 0.36, 0.68, 5, 7, { edge: false })
    + line(ob(0.4, 0.28, 5), ob(0.4, 0.72, 5), ED),
  console: () => {
    const P = ob;
    const screen = [P(0.35, 0.4, 10), P(0.65, 0.4, 10), P(0.65, 0.6, 10), P(0.35, 0.6, 10)];
    return box(0.25, 0.3, 0.75, 0.7, 0, 10) + poly(screen, ED, CRISP) + line(P(0.3, 0.7, 5), P(0.7, 0.7, 5), ED);
  },
  'nav-console': () => {
    const P = ob;
    const [dx, dy] = P(0.5, 0.5, 14);
    return box(0.3, 0.3, 0.7, 0.7, 0, 14) + ellipse(dx, dy, 5.5, 2.6, SH)
      + circle(dx, dy - 3, 4.2, SH) + circle(dx + 1, dy - 4, 3.2, W) + circle(dx, dy - 3, 4.2, 'none', { stroke: ED, 'stroke-width': 1 });
  },
  'power-source': () => {
    const cx = 16, cy = 12, k = 0.62;
    const outer = [[16, 3], [29, 10], [29, 22], [16, 29], [3, 22], [3, 10]].map(([x, y]) => [cx + (x - 16) * k, cy + (y - 16) * k]);
    const inner = [[16, 8], [24, 13], [24, 19], [16, 24], [8, 19], [8, 13]].map(([x, y]) => [cx + (x - 16) * k, cy + (y - 16) * k]);
    let s = box(0.3, 0.3, 0.7, 0.7, 0, 4) + poly(outer, W) + poly(outer, 'none', { stroke: ED, 'stroke-width': 1, 'stroke-linejoin': 'round' });
    for (let i = 0; i < 6; i++) s += line(outer[i], inner[i], ED);
    return s + poly(inner, SH) + circle(cx, cy, 2.6, W);
  },
  rubble: () => {
    const P = ob;
    const chunk = (u, v, s, h) => box(u, v, u + s, v + s * 0.8, 0, h, { edge: false });
    return ellipse(16, 24, 11, 5, SH) + chunk(0.2, 0.55, 0.22, 3) + chunk(0.55, 0.2, 0.26, 4) + chunk(0.42, 0.5, 0.3, 5)
      + chunk(0.7, 0.62, 0.18, 2.5) + poly([P(0.3, 0.25, 0), P(0.5, 0.15, 0), P(0.45, 0.35, 0)], W, CRISP);
  },
  'stairs-n': () => { let s = ''; for (let i = 3; i >= 0; i--) s += box(0.25, 0.75 - i * 0.25, 0.75, 1 - i * 0.25, 0, 4.5 * (i + 1)); return s; },
  'stairs-w': () => { let s = ''; for (let i = 3; i >= 0; i--) s += box(0.75 - i * 0.25, 0.25, 1 - i * 0.25, 0.75, 0, 4.5 * (i + 1)); return s; },
  car: () => {
    const P = ob;
    const wheel = (u, v) => { const [x, y] = P(u, v, 1.5); return ellipse(x, y, 2.2, 2.6, ED); };
    return wheel(0.25, 0.7) + wheel(0.75, 0.7) + wheel(0.9, 0.5) + box(0.05, 0.3, 0.95, 0.7, 2, 7)
      + box(0.3, 0.34, 0.68, 0.66, 7, 12) + poly([P(0.68, 0.36, 8), P(0.68, 0.64, 8), P(0.68, 0.64, 11), P(0.68, 0.36, 11)], ED, CRISP)
      + poly([P(0.34, 0.66, 8), P(0.64, 0.66, 8), P(0.64, 0.66, 11), P(0.34, 0.66, 11)], ED, CRISP)
      + wheel(0.2, 0.3) + wheel(0.7, 0.3);
  },
  lamp: () => ellipse(16, 24, 3.2, 1.6, SH) + `<rect x="15.2" y="5" width="1.6" height="19" fill="${W}"/>` + `<rect x="15.2" y="5" width="0.6" height="19" fill="${SH}"/>`
    + `<rect x="11.5" y="2" width="9" height="4.5" rx="1.5" fill="${W}"/>` + `<rect x="11.5" y="4.5" width="9" height="2" rx="1" fill="${SH}"/>`,
  'alien-pod': () => ellipse(16, 25, 8, 3.5, SH)
    + path('M16 4c-5 0-8 6-8 12s3 10 8 10Z', SH) + path('M16 4c5 0 8 6 8 12s-3 10-8 10Z', W)
    + line([16, 4], [16, 26], ED) + ellipse(16, 5.5, 3, 1.6, SH),
};

// ---------------------------------------------------------------------------------------------------------------
// Floors (32×16).
const floors = {
  floor: () => floorBase(),
  'floor-rough': () => floorBase() + [[10, 7], [19, 4], [23, 9], [14, 11], [8, 9.5], [20, 12.5]]
    .map(([x, y]) => poly([[x, y - 1], [x + 2, y], [x, y + 1], [x - 2, y]], SH)).join(''),
  'road-line': () => {
    const seg = (t0, t1) => { const a = [8 + 16 * t0, 4 + 8 * t0], b = [8 + 16 * t1, 4 + 8 * t1], n = [-0.45, 0.9]; return poly([[a[0] - n[0], a[1] - n[1]], [b[0] - n[0], b[1] - n[1]], [b[0] + n[0], b[1] + n[1]], [a[0] + n[0], a[1] + n[1]]], W); };
    return seg(0.1, 0.4) + seg(0.6, 0.9);
  },
  crater: () => floorBase() + poly([[16, 3], [23, 5], [27, 8], [22, 12], [15, 13.5], [8, 11], [6, 8], [10, 4.5]], SH)
    + poly([[17, 6], [22, 8], [19, 11], [13, 10.5], [11, 8]], ED) + line([10, 4.5], [16, 3], W, 1) + line([16, 3], [23, 5], W, 1),
  'ufo-floor': () => floorBase() + poly([fl(0.15, 0.15), fl(0.85, 0.15), fl(0.85, 0.85), fl(0.15, 0.85)], 'none', { stroke: SH, 'stroke-width': 1, ...CRISP })
    + line(fl(0.5, 0.15), fl(0.5, 0.85), SH) + line(fl(0.15, 0.5), fl(0.85, 0.5), SH),
  'alien-floor': () => floorBase() + poly([[16, 4], [21, 6], [21, 10], [16, 12], [11, 10], [11, 6]], SH)
    + poly([[16, 6], [19, 7.2], [19, 8.8], [16, 10], [13, 8.8], [13, 7.2]], W),
  'xcom-floor': () => floorBase() + line([16, 0], [16, 16], SH) + line([0, 8], [32, 8], SH),
  lift: () => floorBase() + ellipse(16, 8, 9.5, 4.75, SH) + ellipse(16, 8, 9.5, 4.75, 'none', { stroke: ED, 'stroke-width': 1 }) + ellipse(16, 8, 6, 3, W),
  roof: () => poly([fl(0, 0), fl(1, 0), fl(1, 0.5), fl(0, 0.5)], W, CRISP) + poly([fl(0, 0.5), fl(1, 0.5), fl(1, 1), fl(0, 1)], SH, CRISP)
    + line(fl(0, 0.5), fl(1, 0.5), ED),
};

export default function generate() {
  const out = [];
  for (const [k, f] of Object.entries(floors)) out.push({ name: `shape/${k}`, svg: floor(f()) });
  for (const side of ['n', 'w']) {
    out.push({ name: `shape/wall-${side}`, svg: plainWall(side) });
    out.push({ name: `shape/wall-${side}-window`, svg: windowWall(side) });
    out.push({ name: `shape/door-${side}`, svg: doorWall(side) });
    out.push({ name: `shape/half-wall-${side}`, svg: plainWall(side, 12) });
    out.push({ name: `shape/fence-${side}`, svg: fence(side) });
    out.push({ name: `shape/hedge-${side}`, svg: hedge(side) });
    out.push({ name: `shape/ufo-wall-${side}`, svg: ufoWall(side) });
    out.push({ name: `shape/ufo-door-${side}`, svg: ufoDoor(side) });
    out.push({ name: `shape/alien-wall-${side}`, svg: alienWall(side) });
    out.push({ name: `shape/alien-door-${side}`, svg: alienDoor(side) });
    out.push({ name: `shape/xcom-wall-${side}`, svg: xcomWall(side) });
    out.push({ name: `shape/xcom-door-${side}`, svg: xcomDoor(side) });
  }
  for (const [k, f] of Object.entries(objects)) out.push({ name: `shape/${k}`, svg: object(f()) });
  return out;
}
