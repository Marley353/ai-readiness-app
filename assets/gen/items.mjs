// Inventory / stores icons (`item/<id>`), 32×32 viewBox. Flat vector, palette tokens only (ASSET-REF §2).
// Long weapons are drawn diagonally (grip lower-left, muzzle upper-right) so the icon still reads when the inventory
// stretches it into a 1×3 or 2×3 cell footprint. Human hardware = metal-dark / metal-mid with a small xcom-visor
// status light; lasers add a tech-accent stripe; alien weapons = core-casing / hull-alien with plasma-hot cells and a
// violet accent; every recovered alien artefact is built on the ASSET-REF §5.4 alien-core family.
import { C, svg, rect, rrect, circle, ellipse, poly, path, line, ring, ngon, g, F } from './_lib.mjs';

const { metalDark: MD, metalMid: MM, xcomVisor: LED, techAccent: TA, techAccentDeep: TD, plasma: PL, plasmaHot: PH, plasmaCore: PC,
  coreCasing: CC, coreEdge: CE, coreField: CF, coreCentre: CN, alienOrganic: AO, hullAlien: HA, hullBase: HB, debris: DB } = C;

const icon = (body) => svg(32, 32, body);
const rot = (body, deg = -45) => g(body, { transform: `rotate(${deg} 16 16)` });

// ---------------------------------------------------------------------------------------------------------------
// Weapon space: barrel axis y = A, muzzle towards +x, grip hanging below. x ∈ [-2, 34] fits the box after rotation.
const A = 15;
const bar = (x0, x1, y, t, fill = MD, rx = 0) => rrect(x0, y - t / 2, x1 - x0, t, rx, fill);
const box = (x0, x1, y0, y1, fill = MD, rx = 1) => rrect(x0, y0, x1 - x0, y1 - y0, rx, fill);
/** Slanted grip / magazine: top edge at `top`, leaning by `slant` (negative = leans back). */
const grip = (x, top, h = 7, w = 3.5, slant = -1.5, fill = MM) =>
  poly([[x, top], [x + w, top], [x + w + slant, top + h], [x + slant, top + h]], fill);
const stock = (x0, x1, y0, y1, fill = MM) => poly([[x1, y0], [x0, y0 + 1.2], [x0, y1], [x1, y1 - 0.6]], fill);
const led = (x, y) => rect(x, y, 2, 1.4, LED);
const stripe = (x0, x1, y, t = 1.2, fill = TA) => rect(x0, y - t / 2, x1 - x0, t, fill);
/** Baked energy halo: flat plasma disc under a plasma-core centre. */
const halo = (cx, cy, r) => circle(cx, cy, r, PL) + circle(cx, cy, r * 0.62, PH) + circle(cx, cy, r * 0.32, PC);
const cell = (x, y, w = 2, h = 2.2) => rect(x, y, w, h, PH);

// --- Human firearms -------------------------------------------------------------------------------------------
const pistolBody = (laser = false) =>
  box(9, 26, A - 2.2, A + 1.4, MD, 1) + bar(26, 28, A - 0.4, 1.6)                        // slide + barrel tip
  + box(9, 20, A + 1.4, A + 2.6, MD, 0) + grip(10.5, A + 2.6, 7.5, 4, -1.4)              // frame + grip
  + rect(21, A + 2.6, 3.5, 2, MM) + led(12, A - 1)                                      // trigger guard, status light
  + (laser ? stripe(11, 25, A - 1.6, 1) + circle(28.4, A - 0.4, 1.3, TA) : rect(12, A + 3.4, 2.4, 5, MD));
const rifleBody = ({ laser = false } = {}) =>
  stock(-2, 6, A - 1.8, A + 3.2) + bar(20, 34, A - 0.4, 2)                                // stock, barrel
  + box(19, 26, A + 0.6, A + 3, MM, 0.8)                                                  // fore-grip
  + box(5, 21, A - 2.4, A + 2.4, MD, 1) + rect(13, A - 4, 2, 1.8, MD) + led(8, A - 1.6)  // receiver, sight, light
  + grip(6, A + 2.4, 7, 3.4, -1.5)
  + (laser ? stripe(6, 33, A - 2.2, 1) + box(11, 17, A + 2.4, A + 5, MM, 0.5) + circle(34, A - 0.4, 1.4, TA)
    : grip(12, A + 2.4, 6, 3, 1.2));                                                     // magazine
const heavyBody = ({ laser = false, drum = false, brake = false } = {}) =>
  stock(-2, 5, A - 2.2, A + 4) + bar(21, 33, A - 0.2, 3.4)                                 // stock, thick barrel
  + (brake ? [24, 27, 30].map((x) => rect(x, A - 3, 1.6, 5.6, MM)).join('') : bar(30, 34, A - 0.2, 4.2, MM, 0.6))
  + box(4, 22, A - 3.4, A + 3.4, MD, 1.2) + rect(12, A - 5, 3, 1.8, MD) + led(7, A - 2.4) // receiver, sight, light
  + grip(5, A + 3.4, 7, 3.6, -1.5)
  + (laser ? stripe(5, 33, A - 3, 1.4) + box(10, 19, A + 3.4, A + 6.4, MM, 0.6) + circle(34, A - 0.2, 2, TA) + circle(34, A - 0.2, 1, PC)
    : drum ? circle(15, A + 6.2, 4, MM) + circle(15, A + 6.2, 1.6, MD)
      : box(11, 17, A + 3.4, A + 9, MM, 0.6));
const rocketLauncher = () =>
  bar(-2, 34, A, 6, MM, 1.5) + bar(-2, 1.5, A, 7, MD, 0.6) + bar(30.5, 34, A, 7, MD, 0.6)   // tube, end rings
  + rect(6, A - 5.4, 6, 2.6, MD) + rect(14, A - 5, 8, 2.4, MD)                              // shoulder rest, sight
  + grip(11, A + 3, 6.5, 3.5, -1.2) + rect(19, A + 3, 3, 2.4, MD) + led(4, A - 2.2);
const stunRod = () =>
  bar(-2, 12, A, 3.6, MD, 1.8) + bar(11, 30, A, 2.4, MM, 1.2) + rect(9, A - 2.4, 2, 4.8, MM)
  + circle(31, A, 2.6, PL) + rect(29.5, A - 2.2, 4.5, 1.4, PH) + rect(29.5, A + 0.8, 4.5, 1.4, PH) + circle(31, A, 1, PC);

// --- Alien weapons ---------------------------------------------------------------------------------------------
const plasmaPistol = () =>
  box(8, 27, A - 2.6, A + 2, CC, 1.6) + box(10, 25, A - 2.6, A - 1.2, HA, 0.6)             // casing, top plate
  + cell(12, A - 0.6) + cell(15.5, A - 0.6) + rect(11, A + 2, 12, 1.2, AO)                  // cells, violet accent
  + grip(10, A + 3.2, 6.5, 4, -1.4, CC) + halo(28, A - 0.3, 2.4);
const plasmaRifle = () =>
  box(1, 31, A - 2.6, A + 2.6, CC, 2) + box(3, 29, A - 2.6, A - 1.2, HA, 0.6)               // casing, plate
  + [8, 12, 16, 20].map((x) => cell(x, A - 0.4)).join('') + rect(5, A + 2.6, 20, 1.2, AO)   // cells, violet accent
  + grip(6, A + 3.8, 6.5, 3.6, -1.4, CC) + grip(19, A + 3.8, 4.5, 3, 0, CC)                // grip, fore-grip
  + stock(-2, 2, A - 1.4, A + 2.4, HA) + halo(32.4, A, 2.6);
const heavyPlasma = () =>
  box(-1, 32, A - 3.6, A + 3.6, CC, 2.4) + box(1, 30, A - 3.6, A - 2, HA, 0.8) + box(6, 26, A + 2, A + 3.6, HA, 0.6)
  + [7, 11, 15, 19, 23].map((x) => cell(x, A - 1.2, 2.2, 2.8)).join('') + rect(3, A + 3.6, 24, 1.4, AO)
  + grip(5, A + 5, 6.5, 4, -1.4, CC) + grip(20, A + 5, 4.5, 3, 0, CC) + stock(-2, 1, A - 2, A + 2.8, HA)
  + halo(33, A, 3.2);
const smallLauncher = () =>
  box(3, 27, A - 4, A + 3, CC, 3) + box(5, 25, A - 4, A - 2.2, HA, 0.8) + rect(6, A + 3, 18, 1.4, AO)
  + cell(10, A - 1, 2.4, 2.4) + cell(14.5, A - 1, 2.4, 2.4)
  + circle(28, A - 0.5, 4.2, HA) + ring(28, A - 0.5, 3, 1.8, PH) + circle(28, A - 0.5, 1.2, PC)
  + grip(9, A + 4.4, 6, 4, -1.4, CC);
const blasterLauncher = () =>
  box(-2, 32, A - 4.6, A + 4, CC, 4) + box(0, 30, A - 4.6, A - 2.6, HA, 1) + rect(2, A + 4, 26, 1.6, AO)
  + cell(6, A - 1.6, 3, 3.2) + cell(11, A - 1.6, 3, 3.2) + rect(16, A - 6.6, 1.2, 2.2, CE) + rect(20, A - 7.2, 1.2, 2.8, CE)
  + circle(32.5, A - 0.3, 4.6, HA) + ring(32.5, A - 0.3, 3.4, 2, PH) + circle(32.5, A - 0.3, 1.4, PC)
  + grip(8, A + 5.6, 5.5, 4, -1.4, CC) + grip(22, A + 5.6, 4.5, 3, 0, CC);

// --- Ammunition ------------------------------------------------------------------------------------------------
const KIND = { ap: DB, he: C.warn, in: C.fire };
const clip = (w, h, band = DB, tip = null) => {
  const x = 16 - w / 2, y = 16 - h / 2;
  return rrect(x, y, w, h, 1.5, MM) + rect(x, y, w, 3, MD) + rect(x + 1.5, y + h * 0.5, w - 3, 2, band)
    + (tip ? poly([[16 - 2, y], [16, y - 3.5], [16 + 2, y]], tip) + rect(14, y, 4, 1.4, MD) : '')
    + rect(x + w - 2, y + 4, 1, h - 6, MD);
};
const shellBox = (kind, wide = false) => {
  const w = wide ? 14 : 12, x = 16 - w / 2;
  let s = rrect(x, 8, w, 20, 1.5, MM) + rect(x + 1, 22, w - 2, 4, MD);
  for (let i = 0; i < 3; i++) { const cx = x + 2.5 + i * ((w - 5) / 2); s += rect(cx - 1.3, 12, 2.6, 8, MD) + circle(cx, 12, 1.3, KIND[kind]); }
  return s + rect(x + 1, 9, w - 2, 1.4, KIND[kind]);
};
const alienClip = (w = 12, h = 20, cells = 1) => {
  const x = 16 - w / 2, y = 16 - h / 2;
  let s = rrect(x, y, w, h, 2, CC) + rrect(x, y, w, h, 2, 'none', { stroke: CE, 'stroke-width': 1 });
  for (let i = 0; i < cells; i++) s += rect(x + 3, y + 3 + i * 6.5, w - 6, 5, PH) + rect(x + 4.5, y + 4.5 + i * 6.5, w - 9, 2, PC);
  return s + rect(x + 2, y + h - 4, w - 4, 1.6, AO);
};
const rocket = (kind, big = false) => {
  const t = big ? 6 : 4.6, nose = kind === 'in' ? C.fire : kind === 'he' ? C.warn : DB;
  return bar(1, 25, A, t, MM, t / 2) + poly([[25, A - t / 2], [32, A], [25, A + t / 2]], nose)
    + rect(6, A - t / 2 - 0.2, 2, t + 0.4, MD) + rect(20, A - t / 2 - 0.2, 1.6, t + 0.4, MD)
    + poly([[1, A - t / 2], [-2, A - t / 2 - 3], [4, A - t / 2]], MD) + poly([[1, A + t / 2], [-2, A + t / 2 + 3], [4, A + t / 2]], MD)
    + (big ? rect(10, A - 1, 8, 2, DB) : '');
};

// --- Grenades, equipment ----------------------------------------------------------------------------------------
const grenade = () =>
  ellipse(16, 19, 7, 8.5, MM) + [12.5, 16, 19.5].map((x) => rect(x - 0.5, 11, 1, 16, MD)).join('')
  + [15, 19, 23].map((y) => rect(9.5, y - 0.5, 13, 1, MD)).join('')
  + rect(13, 6.5, 6, 4.5, MD) + rect(19, 7, 5, 1.6, MM) + ring(11.5, 8.5, 2.4, 1.4, DB);
const smokeGrenade = () =>
  rrect(10, 7, 12, 22, 2, C.smoke) + rect(10, 7, 12, 3.5, MD) + rect(12, 4.5, 8, 3, MM) + rect(10, 17, 12, 3, DB)
  + circle(16, 6, 1.2, MD);
const proximityGrenade = () =>
  ellipse(16, 22, 10, 4.5, MD) + rect(6, 15, 20, 7, MM) + ellipse(16, 15, 10, 4.5, MM) + ellipse(16, 15, 8, 3.4, MD)
  + circle(16, 15, 2.8, C.ok) + circle(16, 15, 1.4, LED) + rect(23, 12, 2, 4, MM);
const highExplosive = () =>
  rrect(3, 10, 26, 12, 2, MD) + rect(8, 10, 2.5, 12, C.warn) + rect(21.5, 10, 2.5, 12, C.warn)
  + rrect(12, 12.5, 8, 7, 1, TD) + rect(13.5, 14, 5, 2.4, MM) + circle(15, 17.8, 1, LED) + rect(24.5, 8, 3, 3, MM);
const electroFlare = () =>
  ellipse(16, 22, 9, 4.5, MM) + rect(7, 19.5, 18, 2.5, MM) + ellipse(16, 19.5, 9, 4.5, MD)
  + circle(16, 15, 7.5, C.warn) + circle(16, 15, 4.6, C.fireCore) + circle(16, 15, 2, C.coat);
const motionScanner = () =>
  rrect(9, 3, 14, 26, 2, TD) + rrect(11, 5, 10, 12, 1, MD)
  + path('M12.5 15.5a3.5 3.5 0 0 1 7 0', 'none', { stroke: TA, 'stroke-width': 1 })
  + path('M11.5 16.5a4.5 4.5 0 0 1 9 0', 'none', { stroke: TA, 'stroke-width': 0.8 })
  + line([16, 16.5], [16, 6], TA, 1) + circle(18.2, 10, 1.1, TA) + circle(16, 16.5, 1, TA)
  + [19, 22.5].map((y) => rect(11.5, y, 4, 2, MM) + rect(16.5, y, 4, 2, MM)).join('') + rect(12, 26, 8, 1.6, MM);
const mediKit = () =>
  rrect(8, 3, 16, 26, 2, C.coat) + rrect(9.5, 8, 13, 18, 1, C.coatShadow) + rect(11, 4.5, 10, 2, MM)
  + rect(14.2, 11, 3.6, 12, C.ok) + rect(10, 15.2, 12, 3.6, C.ok);
const psiAmp = () =>
  rrect(13, 17, 6, 13, 2, CC) + rect(13, 22, 6, 2, AO) + rrect(13, 17, 6, 13, 2, 'none', { stroke: CE, 'stroke-width': 1 })
  + poly(ngon(16, 10, 8.5, 6), CC, { stroke: CE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' })
  + poly(ngon(16, 10, 5.2, 6), CF) + circle(16, 10, 2.6, CN) + ring(16, 10, 4.2, 3.4, AO);
const mindProbe = () =>
  circle(16, 16, 11.5, CC, { stroke: CE, 'stroke-width': 1.5 }) + ellipse(16, 16, 11, 4, CF)
  + circle(16, 16, 5.5, CF) + circle(16, 16, 3.6, PH) + circle(16, 16, 1.8, CN) + rect(14.5, 3, 3, 3, AO) + rect(14.5, 26, 3, 3, AO);
const stunBomb = () =>
  circle(16, 16, 10, CC, { stroke: CE, 'stroke-width': 1.5 }) + ring(16, 16, 6.5, 4.8, PH) + circle(16, 16, 3, CN)
  + rect(15, 4.5, 2, 3, AO) + rect(15, 24.5, 2, 3, AO);
const blasterBomb = () =>
  rrect(11, 2, 10, 28, 5, CC, { stroke: CE, 'stroke-width': 1.2 }) + ellipse(16, 6.5, 3.4, 3.4, AO)
  + [12, 17, 22].map((y) => rect(13.5, y, 5, 3.4, PH) + rect(15, y + 1, 2, 1.4, PC)).join('') + rect(12.5, 27, 7, 1.6, HA);
const alienGrenade = () =>
  poly(ngon(16, 16, 11, 6), CC, { stroke: CE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' })
  + ring(16, 16, 6.2, 4.4, PH) + circle(16, 16, 2.6, CN) + rect(11, 14.9, 10, 2.2, AO) + rect(14.9, 11, 2.2, 10, AO);

// --- Armour torsos ---------------------------------------------------------------------------------------------
const helmet = (y, w, visor = true) => rrect(16 - w / 2, y, w, w * 0.9, w * 0.3, C.xcomHelmet) + (visor ? rrect(16 - w / 2 + 1.5, y + w * 0.4, w - 3, 2, 0.8, LED) : '');
const personalArmour = () =>
  poly([[5, 12], [12, 10], [20, 10], [27, 12], [26, 20], [22, 22], [22, 30], [10, 30], [10, 22], [6, 20]], C.xcomArmour)
  + rrect(12, 13, 8, 10, 1, C.xcomArmourShadow) + rect(6.5, 13, 4, 6, C.xcomArmourShadow) + rect(21.5, 13, 4, 6, C.xcomArmourShadow)
  + helmet(2, 8);
const powerSuit = () =>
  poly([[3, 12], [11, 9], [21, 9], [29, 12], [28, 22], [23, 24], [23, 31], [9, 31], [9, 24], [4, 22]], C.xcomArmour)
  + rrect(3, 11, 7, 8, 2, C.xcomHelmet) + rrect(22, 11, 7, 8, 2, C.xcomHelmet)
  + rrect(11.5, 12, 9, 12, 1, C.xcomArmourShadow) + rect(13, 14, 6, 2, C.xcomArmour) + rect(13, 18, 6, 2, C.xcomArmour)
  + rect(9, 25, 14, 1.6, C.xcomArmourShadow) + helmet(1, 9);
const flyingSuit = () =>
  powerSuit() + rrect(4, 20, 4, 6, 1, MM) + rrect(24, 20, 4, 6, 1, MM)
  + rect(4.6, 26, 2.8, 3, PL) + rect(24.6, 26, 2.8, 3, PL) + rect(5.3, 26, 1.4, 1.6, PC) + rect(25.3, 26, 1.4, 1.6, PC);

// --- Recovered alien artefacts: the ASSET-REF alien-core family ---------------------------------------------------
const OUTER = [[16, 3], [29, 10], [29, 22], [16, 29], [3, 22], [3, 10]];
const INNER = [[16, 8], [24, 13], [24, 19], [16, 24], [8, 19], [8, 13]];
const casing = () => poly(OUTER, CC, { stroke: CE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
const core = (centre = true) => casing() + poly(INNER, CF) + (centre ? circle(16, 16, 4, CN) : '');
const artefacts = {
  'ufo-power-source': () => core() + ring(16, 16, 6.5, 5.5, PH),
  'ufo-navigation': () => core(false) + ring(16, 16, 6, 5, CN) + line([16, 9], [16, 23], CN, 1) + line([9, 16], [23, 16], CN, 1) + circle(16, 16, 2, CN),
  'alien-alloys': () => casing() + [11, 15, 19].map((y) => poly([[9, y], [23, y], [21, y + 3], [7, y + 3]], HA)).join('') + circle(16, 24, 1.6, CN),
  'elerium-115': () => core(false) + poly([[16, 10], [21, 14], [19, 21], [13, 21], [11, 14]], CN) + poly([[16, 12.5], [19, 15], [17.5, 19.5], [14.5, 19.5], [13, 15]], PH)
    + circle(16, 16, 1.6, C.coat) + poly([[8, 22], [10, 19], [12, 23]], CE) + poly([[20, 23], [22, 19], [24, 22]], CE),
  'alien-food': () => core(false) + ellipse(16, 17, 6.5, 4.5, AO) + ellipse(13.5, 14, 2.4, 2, AO) + ellipse(19, 13.5, 2, 1.8, AO) + circle(16, 17, 1.4, CN),
  'alien-entertainment': () => core(false) + path('M9 16h2l1.5-4 2 8 2-8 2 8 2-8 1.5 4h2', 'none', { stroke: CN, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
  'alien-reproduction': () => core(false) + path('M16 9.5c4 0 6 4.5 6 8a6 6 0 0 1-12 0c0-3.5 2-8 6-8Z', AO) + circle(16, 17.5, 2.2, CN),
  'alien-surgery': () => core(false) + rect(9.5, 15, 13, 2.2, CN) + rect(15, 9.5, 2.2, 13, CN) + poly([[19, 10], [23, 10], [23, 12], [21, 14]], HA),
  'examination-room': () => core(false) + rect(9, 17, 14, 2.4, HA) + rect(10.5, 19.4, 1.6, 3.6, HA) + rect(19.9, 19.4, 1.6, 3.6, HA)
    + ellipse(16, 15, 5.5, 2.4, CN) + circle(11, 14.6, 1.4, AO),
  'alien-habitat': () => core(false) + [[11, 16], [16, 13.5], [21, 16]].map(([x, y]) => path(`M${x - 2.6} ${y + 4}v-3a2.6 2.6 0 0 1 5.2 0v3Z`, AO)).join('') + circle(16, 20.5, 1.4, CN),
};

// --- Heavy weapons platforms (stores icons, top-down) ---------------------------------------------------------
const tankBase = (hover = false) => hover
  ? ellipse(16, 24, 11, 4, PL) + ellipse(16, 24, 7, 2.2, PH) + rrect(6, 6, 20, 18, 6, HB) + rrect(6, 6, 20, 18, 6, 'none', { stroke: TA, 'stroke-width': 1.2 })
  : rrect(4, 5, 5, 22, 1.5, MM) + rrect(23, 5, 5, 22, 1.5, MM) + [8, 12, 16, 20, 24].map((y) => rect(4, y, 5, 1, MD) + rect(23, y, 5, 1, MD)).join('')
    + rrect(8, 6, 16, 20, 1.5, HB);
const hwps = {
  'tank-cannon': () => tankBase() + circle(16, 17, 5, MM) + rect(14.8, 2, 2.4, 14, MD) + circle(16, 17, 1.4, LED),
  'tank-rocket': () => tankBase() + rrect(11, 12, 10, 8, 1, MM) + rect(12.5, 4, 2.6, 10, MD) + rect(16.9, 4, 2.6, 10, MD) + circle(13.8, 4.5, 1.3, C.warn) + circle(18.2, 4.5, 1.3, C.warn) + circle(16, 22, 1.2, LED),
  'tank-laser': () => tankBase() + circle(16, 17, 5, MM) + rect(14.8, 2, 2.4, 14, MD) + rect(15.4, 3, 1.2, 12, TA) + circle(16, 2.5, 1.4, TA) + circle(16, 17, 1.4, LED),
  'hovertank-plasma': () => tankBase(true) + circle(16, 15, 5, MM) + rect(14.6, 1.5, 2.8, 14, CC) + rect(15.2, 5, 1.6, 4, PH) + halo(16, 2.6, 2.2) + circle(16, 15, 1.4, LED),
  'hovertank-launcher': () => tankBase(true) + rrect(10, 9, 12, 9, 1.5, MM) + rrect(12, 2, 8, 9, 1, CC) + ring(16, 4.5, 2.6, 1.4, PH) + circle(16, 20, 1.2, LED),
  'hwp-cannon-shells': () => [8, 16, 24].map((x) => rect(x - 2.6, 12, 5.2, 16, MM) + poly([[x - 2.6, 12], [x, 5], [x + 2.6, 12]], DB) + rect(x - 2.6, 24, 5.2, 2, MD)).join(''),
  'hwp-rockets': () => [11, 21].map((x) => rrect(x - 3, 10, 6, 17, 3, MM) + poly([[x - 3, 11], [x, 3], [x + 3, 11]], C.warn) + poly([[x - 3, 27], [x - 5.5, 30], [x - 3, 24]], MD) + poly([[x + 3, 27], [x + 5.5, 30], [x + 3, 24]], MD)).join(''),
  'hwp-fusion-bomb': () => poly([[16, 4], [27, 10], [27, 22], [16, 28], [5, 22], [5, 10]], CC, { stroke: CE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }) + halo(16, 16, 7),
};

// --- Craft weapons ----------------------------------------------------------------------------------------------
const missile = (x, y, len, w, tip) => rrect(x - w / 2, y, w, len, w / 2, MM) + poly([[x - w / 2, y + 1], [x, y - w], [x + w / 2, y + 1]], tip)
  + poly([[x - w / 2, y + len], [x - w / 2 - 2.2, y + len + 2.5], [x - w / 2, y + len - 3]], MD) + poly([[x + w / 2, y + len], [x + w / 2 + 2.2, y + len + 2.5], [x + w / 2, y + len - 3]], MD);
const pod = (w, h, fill = MM, edge = MD) => rrect(16 - w / 2, 16 - h / 2, w, h, w / 3, fill) + rect(16 - w / 2 + 1.5, 16 - h / 2 + 2, w - 3, 2, edge) + rect(16 - w / 2 + 1.5, 16 + h / 2 - 4, w - 3, 2, edge);
const craftWeapons = {
  'stingray-launcher': () => pod(12, 24) + rect(11, 6, 1.6, 20, MD) + rect(19.4, 6, 1.6, 20, MD) + poly([[13, 9], [16, 4], [19, 9]], C.warn) + led(15, 22),
  'stingray-missiles': () => missile(11, 8, 18, 4.5, C.warn) + missile(21, 8, 18, 4.5, C.warn),
  'avalanche-launcher': () => pod(16, 26) + rect(10, 5, 2, 22, MD) + rect(20, 5, 2, 22, MD) + poly([[11, 8], [16, 2], [21, 8]], C.warn) + led(15, 23),
  'avalanche-missiles': () => missile(10, 7, 20, 6, C.warn) + missile(22, 7, 20, 6, C.warn),
  cannon: () => rrect(9, 15, 14, 12, 3, MM) + [12, 16, 20].map((x) => rect(x - 1.2, 3, 2.4, 13, MD)).join('') + rect(9, 14, 14, 2.4, MD) + circle(16, 21, 2.2, MD) + led(14.5, 24.5),
  'cannon-rounds': () => [7, 12, 17, 22, 27].map((x, i) => rect(x - 1.8, 12 + (i % 2) * 2, 3.6, 10, MM) + poly([[x - 1.8, 12 + (i % 2) * 2], [x, 8 + (i % 2) * 2], [x + 1.8, 12 + (i % 2) * 2]], DB)).join('') + rect(4, 22, 24, 2.2, MD),
  'laser-cannon': () => pod(12, 26) + stripe(16, 16, 5, 1) + rect(15, 6, 2, 17, TA) + circle(16, 5, 2.4, TA) + circle(16, 5, 1.1, PC) + led(13, 24),
  'plasma-beam': () => rrect(10, 3, 12, 26, 4, CC, { stroke: CE, 'stroke-width': 1.2 }) + [10, 15, 20].map((y) => rect(13, y, 6, 3.4, PH)).join('') + rect(11.5, 25, 9, 1.6, AO) + halo(16, 4.6, 3),
  'fusion-ball-launcher': () => rrect(8, 4, 16, 24, 5, CC, { stroke: CE, 'stroke-width': 1.2 }) + ring(16, 10, 5, 3.4, PH) + circle(16, 10, 1.8, PC) + rect(11, 19, 10, 2.6, AO) + rect(11, 23, 10, 1.6, HA),
  'fusion-ball': () => ring(16, 16, 12, 10, CC) + halo(16, 16, 9.5),
};

// --- Bodies: races (`<race>-live` upright, `<race>-corpse` prone) and the human corpse -------------------------
const SK = { s: C.snowShade, sd: C.smoke };
const humanoid = (head, body, legs, arms = body) =>
  rect(9, 14, 3, 9, arms) + rect(20, 14, 3, 9, arms) + rrect(11, 13, 10, 11, 2, body) + rect(11.5, 24, 3.5, 7, legs) + rect(17, 24, 3.5, 7, legs) + head;
const races = {
  sectoid: () => rect(13, 12, 6, 3, SK.s) + rrect(12, 15, 8, 9, 2, HA) + rect(10, 16, 2, 8, SK.s) + rect(20, 16, 2, 8, SK.s) + rect(12.5, 24, 3, 7, SK.sd) + rect(16.5, 24, 3, 7, SK.sd)
    + ellipse(16, 8, 7, 6.5, SK.s) + ellipse(16, 10.5, 5.5, 3.5, SK.s) + ellipse(13, 8.5, 2.2, 1.4, MD, { transform: 'rotate(-20 13 8.5)' }) + ellipse(19, 8.5, 2.2, 1.4, MD, { transform: 'rotate(20 19 8.5)' }),
  floater: () => rrect(11, 13, 10, 11, 2, HA) + rect(9, 14, 3, 8, AO) + rect(20, 14, 3, 8, AO) + rect(13, 24, 6, 5, MM) + rect(14, 29, 4, 2, PH)
    + rrect(12, 4, 8, 9, 3, AO) + rect(13.5, 8, 5, 1.6, CC) + rect(12, 9, 8, 4, CC) + line([21, 10], [24, 6], HA, 1.5) + circle(24, 5.5, 1.3, PH),
  snakeman: () => path('M11 31c-4 0-6-3-4-6s6-2 8-4v-8h6v9c-2 3-8 3-8 6s4 1 6 3H11Z', CF) + rrect(11, 10, 10, 11, 2, CF) + rect(9, 11, 3, 8, CF) + rect(20, 11, 3, 8, CF)
    + rect(13, 12, 6, 8, CE) + poly([[16, 1], [22, 5], [21, 11], [11, 11], [10, 5]], CF) + rect(13, 6, 2.4, 1.6, C.fireCore) + rect(16.6, 6, 2.4, 1.6, C.fireCore),
  muton: () => rrect(8, 11, 16, 13, 2, C.alienWall) + rect(4, 12, 4, 10, C.alienWall) + rect(24, 12, 4, 10, C.alienWall) + rect(8, 15, 16, 3, HA) + rect(8, 20, 16, 2, CC)
    + rect(10, 24, 5, 7, CC) + rect(17, 24, 5, 7, CC) + rrect(12, 5, 8, 7, 2, C.alienWall) + rect(13.5, 7.5, 2, 1.5, C.fireCore) + rect(16.5, 7.5, 2, 1.5, C.fireCore),
  ethereal: () => ring(16, 20, 11, 9.5, C.psi) + poly([[16, 2], [22, 6], [24, 31], [8, 31], [10, 6]], CC) + poly([[16, 3], [21, 7], [20, 14], [12, 14], [11, 7]], AO)
    + poly([[16, 5], [19, 8], [18, 12], [14, 12], [13, 8]], CC) + circle(14.5, 9, 0.9, CN) + circle(17.5, 9, 0.9, CN) + rect(11, 16, 10, 1.6, CE),
  chryssalid: () => rect(14, 12, 4, 12, AO) + poly([[12, 8], [20, 8], [19, 14], [13, 14]], AO) + rect(13.5, 4, 5, 5, CC) + circle(14.8, 6.5, 0.9, C.fireCore) + circle(17.2, 6.5, 0.9, C.fireCore)
    + path('M14 14L6 8l2 8 4 2Z', AO) + path('M18 14l8-6-2 8-4 2Z', AO) + path('M12 12L4 4l1 3M20 12l8-8-1 3', 'none', { stroke: CC, 'stroke-width': 1.5, 'stroke-linecap': 'round' })
    + path('M14 22l-6 9M18 22l6 9M15 22l-3 9M17 22l3 9', 'none', { stroke: CC, 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
  silacoid: () => ellipse(16, 22, 12, 8, C.fire) + ellipse(14, 19, 8, 5, C.fireCore) + [[9, 24], [20, 26], [15, 27], [24, 22]].map(([x, y]) => ellipse(x, y, 2.2, 1.4, C.scorch)).join(''),
  celatid: () => path('M16 4c7 0 10 6 10 12s-4 10-10 10S6 22 6 16 9 4 16 4Z', CF) + ellipse(16, 12, 5.5, 3.5, CE) + circle(16, 12, 2, CC)
    + path('M9 24l-3 6M13 26l-1 5M19 26l1 5M23 24l3 6', 'none', { stroke: CE, 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
  reaper: () => rrect(4, 10, 24, 12, 4, C.alienWall) + rrect(19, 5, 11, 9, 3, C.alienWall) + poly([[22, 12], [30, 12], [28, 16], [23, 15]], AO)
    + [24, 27].map((x) => poly([[x, 12], [x + 1.5, 12], [x + 0.8, 14.5]], C.coat)).join('') + circle(26, 8, 1.1, C.fireCore)
    + [6, 11, 20, 25].map((x) => rect(x, 22, 3.5, 9, CC)).join(''),
  cyberdisc: () => ellipse(16, 18, 14, 6, HA) + ellipse(16, 16, 14, 6, HA) + ellipse(16, 16, 14, 6, 'none', { stroke: MD, 'stroke-width': 1 })
    + ring(16, 16, 9, 7.2, PH) + circle(16, 16, 4, CC) + circle(16, 16, 1.8, PC) + rect(15, 21, 2, 3, PH),
  sectopod: () => rrect(7, 6, 18, 12, 3, HA) + rect(9, 8, 14, 3, HB) + rrect(12, 3, 8, 4, 1, HB) + circle(16, 13.5, 2.6, PL) + circle(16, 13.5, 1.2, PC)
    + path('M9 18l-3 6 1 7M23 18l3 6-1 7M12 18l-1 7 1 6M20 18l1 7-1 6', 'none', { stroke: HB, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  zombie: () => humanoid(rrect(12, 3, 8, 9, 3, C.smoke) + rect(13.5, 7, 2, 1.4, AO) + rect(16.5, 7, 2, 1.4, AO), C.trouser, C.trouser, C.smoke)
    + ellipse(14, 17, 2, 2.6, AO) + ellipse(19, 21, 1.6, 2, AO) + rect(9, 12, 3, 3, C.smoke),
};
const corpseSlab = () => ellipse(16, 24, 14, 5, C.scorch) + ellipse(16, 24, 14, 5, 'none', { stroke: DB, 'stroke-width': 1 });
const prone = (body) => g(body, { transform: 'translate(16 21) rotate(-90) scale(0.85) translate(-16 -16)' });
const humanCorpse = () => corpseSlab() + prone(
  rrect(11, 4, 10, 9, 3, C.xcomHelmet) + rrect(13, 8, 7, 3, 1, C.xcomArmourShadow) + rrect(10, 14, 12, 10, 2, C.xcomArmour) + rect(12, 16, 8, 6, C.xcomArmourShadow)
  + rect(11, 24, 4, 7, C.xcomBoots) + rect(17, 24, 4, 7, C.xcomBoots) + rect(7, 15, 3, 9, C.xcomArmour) + rect(22, 15, 3, 9, C.xcomArmour));

// ---------------------------------------------------------------------------------------------------------------
export default function generate() {
  const out = [];
  const add = (id, body) => out.push({ name: `item/${id}`, svg: icon(body) });
  // Human firearms (diagonal).
  add('pistol', rot(pistolBody()));
  add('rifle', rot(rifleBody()));
  add('heavy-cannon', rot(heavyBody()));
  add('auto-cannon', rot(heavyBody({ drum: true, brake: true })));
  add('rocket-launcher', rot(rocketLauncher()));
  add('laser-pistol', rot(pistolBody(true)));
  add('laser-rifle', rot(rifleBody({ laser: true })));
  add('heavy-laser', rot(heavyBody({ laser: true })));
  add('stun-rod', rot(stunRod()));
  // Alien firearms (diagonal).
  add('plasma-pistol', rot(plasmaPistol()));
  add('plasma-rifle', rot(plasmaRifle()));
  add('heavy-plasma', rot(heavyPlasma()));
  add('small-launcher', rot(smallLauncher()));
  add('blaster-launcher', rot(blasterLauncher()));
  // Ammunition.
  add('pistol-clip', clip(8, 15, DB, DB));
  add('rifle-clip', clip(9, 20, DB, DB));
  for (const k of ['ap', 'he', 'in']) { add(`hc-${k}-ammo`, shellBox(k, true)); add(`ac-${k}-ammo`, shellBox(k)); }
  add('small-rocket', rot(rocket('he')));
  add('large-rocket', rot(rocket('he', true)));
  add('incendiary-rocket', rot(rocket('in')));
  add('plasma-pistol-clip', alienClip(10, 14, 1));
  add('plasma-rifle-clip', alienClip(11, 20, 2));
  add('heavy-plasma-clip', alienClip(14, 24, 3));
  add('stun-bomb', stunBomb());
  add('blaster-bomb', blasterBomb());
  add('alien-grenade', alienGrenade());
  // Grenades and equipment.
  add('grenade', grenade());
  add('smoke-grenade', smokeGrenade());
  add('proximity-grenade', proximityGrenade());
  add('high-explosive', highExplosive());
  add('electro-flare', electroFlare());
  add('motion-scanner', motionScanner());
  add('medi-kit', mediKit());
  add('psi-amp', psiAmp());
  add('mind-probe', mindProbe());
  // Armour.
  add('personal-armour', personalArmour());
  add('power-suit', powerSuit());
  add('flying-suit', flyingSuit());
  // Artefacts, HWPs, craft weapons.
  for (const [k, f] of Object.entries(artefacts)) add(k, f());
  for (const [k, f] of Object.entries(hwps)) add(k, f());
  for (const [k, f] of Object.entries(craftWeapons)) add(k, f());
  // Bodies.
  add('corpse', humanCorpse());
  for (const [race, f] of Object.entries(races)) {
    add(`${race}-live`, f());
    add(`${race}-corpse`, corpseSlab() + prone(f()));
  }
  return out;
}
