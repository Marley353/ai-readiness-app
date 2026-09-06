// Shared helpers for the procedural SVG generators in assets/gen/.
// Not a generator itself: the default export returns an empty list so an atlas build that globs *.mjs is unaffected.
// Every emitted SVG is a complete document (xmlns + viewBox + width/height), carries no id attributes, uses flat
// fills only (no gradients) and only the palette tokens below (mirror of src/design/palette.ts).

export const C = {
  // X-COM personnel — combat
  xcomHelmet: '#2d4a22', xcomVisor: '#48bb78', xcomArmour: '#3f6212', xcomArmourShadow: '#1e3a1e', xcomBoots: '#1f2937',
  // X-COM personnel — support
  skinLight: '#fbcfe8', coat: '#f8fafc', coatShadow: '#e2e8f0', trouser: '#334155',
  // Weapons and hardware
  metalDark: '#111827', metalMid: '#374151', hullBase: '#1e293b', hullAlien: '#475569', debris: '#64748b',
  // Energy and alien tech
  techAccent: '#38bdf8', techAccentDeep: '#0284c7', plasma: '#06b6d4', plasmaHot: '#22d3ee', plasmaCore: '#67e8f9',
  coreCasing: '#1e1b4b', coreEdge: '#818cf8', coreField: '#6366f1', coreCentre: '#a5f3fc', alienOrganic: '#a855f7',
  // Terrain
  scorch: '#451a03',
  // UI shell
  shell0: '#0b1020', shell1: '#111827', shell2: '#1e293b', shell3: '#334155', border: '#475569',
  text: '#f8fafc', textMuted: '#94a3b8', textDim: '#64748b',
  accent: '#38bdf8', accentDeep: '#0284c7', warn: '#f59e0b', warnDeep: '#b45309', critical: '#ef4444', criticalDeep: '#991b1b', ok: '#48bb78',
  // Terrain family
  grass: '#4d7c0f', grassShade: '#3f6212', soil: '#78350f', soilShade: '#451a03', sand: '#d6b26a', sandShade: '#b8933f',
  snow: '#e2e8f0', snowShade: '#cbd5e1', forest: '#166534', forestShade: '#14532d', jungle: '#15803d', jungleShade: '#166534',
  wood: '#92400e', woodShade: '#78350f', concrete: '#94a3b8', concreteShade: '#64748b', asphalt: '#334155', asphaltShade: '#1e293b',
  brick: '#9a3412', brickShade: '#7c2d12', roof: '#475569', roofShade: '#334155', glass: '#38bdf8', water: '#0369a1', waterShade: '#075985',
  alienWall: '#312e81', alienWallShade: '#1e1b4b', alienFloor: '#3730a3', alienFloorShade: '#312e81',
  ufoWall: '#475569', ufoWallShade: '#334155', ufoFloor: '#64748b', ufoFloorShade: '#475569',
  smoke: '#94a3b8', fire: '#f97316', fireCore: '#fde047', stunCloud: '#a5f3fc', psi: '#a855f7', night: '#0b1020',
};

// Terrain master tones (tinted at runtime: multiply by the tile's palette colour).
export const W = '#ffffff';   // lit faces
export const SH = '#b3b3b3';  // the single shading step (screen-left faces, undersides, recesses)
export const ED = '#808080';  // 1-unit separating edges

export const F = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
export const attrs = (o = {}) => Object.entries(o)
  .filter(([, v]) => v !== undefined && v !== null && v !== '')
  .map(([k, v]) => ` ${k}="${v}"`).join('');

export const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export const rect = (x, y, w, h, fill, o = {}) =>
  `<rect${attrs({ x: F(x), y: F(y), width: F(w), height: F(h), fill, ...o })}/>`;
export const rrect = (x, y, w, h, rx, fill, o = {}) => rect(x, y, w, h, fill, { rx: F(rx), ...o });
export const circle = (cx, cy, r, fill, o = {}) => `<circle${attrs({ cx: F(cx), cy: F(cy), r: F(r), fill, ...o })}/>`;
export const ellipse = (cx, cy, rx, ry, fill, o = {}) =>
  `<ellipse${attrs({ cx: F(cx), cy: F(cy), rx: F(rx), ry: F(ry), fill, ...o })}/>`;
export const pts = (p) => p.map(([x, y]) => `${F(x)},${F(y)}`).join(' ');
export const poly = (p, fill, o = {}) => `<polygon${attrs({ points: pts(p), fill, ...o })}/>`;
export const path = (d, fill, o = {}) => `<path${attrs({ d, fill, ...o })}/>`;
export const line = (a, b, stroke, w = 1, o = {}) =>
  `<line${attrs({ x1: F(a[0]), y1: F(a[1]), x2: F(b[0]), y2: F(b[1]), stroke, 'stroke-width': F(w), ...o })}/>`;
export const polyline = (p, stroke, w = 1, o = {}) =>
  `<polyline${attrs({ points: pts(p), fill: 'none', stroke, 'stroke-width': F(w), ...o })}/>`;
export const g = (body, o = {}) => `<g${attrs(o)}>${body}</g>`;

/** Ring (annulus) as a single even-odd path — no stroke attribute needed. */
export const ring = (cx, cy, ro, ri, fill, o = {}) => path(
  `M${F(cx - ro)} ${F(cy)}a${F(ro)} ${F(ro)} 0 1 0 ${F(ro * 2)} 0a${F(ro)} ${F(ro)} 0 1 0 ${F(-ro * 2)} 0Z` +
  `M${F(cx - ri)} ${F(cy)}a${F(ri)} ${F(ri)} 0 1 0 ${F(ri * 2)} 0a${F(ri)} ${F(ri)} 0 1 0 ${F(-ri * 2)} 0Z`,
  fill, { 'fill-rule': 'evenodd', ...o });

/** Rounded-rect outline of thickness t as an even-odd path. */
export const frame = (x, y, w, h, t, rx, fill, o = {}) => {
  const rr = (X, Y, Wd, Ht, R) => {
    R = Math.min(R, Wd / 2, Ht / 2);
    return `M${F(X + R)} ${F(Y)}h${F(Wd - 2 * R)}a${F(R)} ${F(R)} 0 0 1 ${F(R)} ${F(R)}v${F(Ht - 2 * R)}a${F(R)} ${F(R)} 0 0 1 ${F(-R)} ${F(R)}h${F(-(Wd - 2 * R))}a${F(R)} ${F(R)} 0 0 1 ${F(-R)} ${F(-R)}v${F(-(Ht - 2 * R))}a${F(R)} ${F(R)} 0 0 1 ${F(R)} ${F(-R)}Z`;
  };
  return path(rr(x, y, w, h, rx) + rr(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0, rx - t)), fill, { 'fill-rule': 'evenodd', ...o });
};

/** Regular polygon points. */
export const ngon = (cx, cy, r, n, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + i * 2 * Math.PI / n), cy + r * Math.sin(rot + i * 2 * Math.PI / n)]);

/** Isometric projection for a viewBox whose floor diamond has its top vertex at (16, top). */
export const isoAt = (top) => (u, v, z = 0) => [16 + (u - v) * 16, top + (u + v) * 8 - z];

export default function generate() { return []; }
