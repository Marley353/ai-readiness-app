// Parametric unit rigs → unit/<body>/<facing 0-4>/<anim> sprites. Flat vector, palette only, feet on the tile origin.
import { C, svg as wrap } from './_lib.mjs';
const rr = (x, y, w, h, fill, r = 1.5, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${o}/>`;
const el = (cx, cy, rx, ry, fill, o = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${o}/>`;
const poly = (pts, fill, o = '') => `<polygon points="${pts}" fill="${fill}"${o}/>`;
const BODIES = {
  'xcom-none': { helmet: C.xcomHelmet, visor: C.xcomVisor, torso: C.xcomArmour, torsoShade: C.xcomArmourShadow, legs: C.xcomBoots, weapon: C.metalDark, grip: C.metalMid },
  'xcom-personal': { helmet: C.xcomHelmet, visor: C.xcomVisor, torso: C.xcomArmour, torsoShade: C.xcomArmourShadow, legs: C.xcomBoots, weapon: C.metalDark, grip: C.metalMid, plates: C.hullBase },
  'xcom-power': { helmet: C.xcomHelmet, visor: C.xcomVisor, torso: C.xcomArmourShadow, torsoShade: C.xcomHelmet, legs: C.xcomArmourShadow, weapon: C.metalDark, grip: C.metalMid, plates: C.hullBase, bulk: 2 },
  'xcom-flying': { helmet: C.xcomHelmet, visor: C.xcomVisor, torso: C.xcomArmourShadow, torsoShade: C.xcomHelmet, legs: C.xcomArmourShadow, weapon: C.metalDark, grip: C.metalMid, plates: C.hullBase, bulk: 2, thrusters: C.plasma },
  sectoid: { skin: C.coatShadow, head: 1.6, torso: C.hullAlien, torsoShade: C.debris, legs: C.hullAlien, weapon: C.coreCasing, grip: C.plasmaHot, eyes: C.coreCasing, short: 3 },
  floater: { skin: C.alienOrganic, head: 1, torso: C.alienOrganic, torsoShade: C.coreCasing, legs: C.hullAlien, weapon: C.coreCasing, grip: C.plasmaHot, hover: true, eyes: C.plasmaHot },
  snakeman: { skin: C.coreField, head: 1.1, torso: C.coreField, torsoShade: C.coreCasing, legs: C.coreEdge, weapon: C.coreCasing, grip: C.plasmaHot, tail: true, tall: 2 },
  muton: { skin: C.coreEdge, head: 1.1, torso: C.coreCasing, torsoShade: C.hullAlien, legs: C.coreCasing, weapon: C.coreCasing, grip: C.plasmaHot, bulk: 3, harness: C.hullAlien },
  ethereal: { skin: C.coreCasing, head: 1, torso: C.coreField, torsoShade: C.coreCasing, legs: C.coreField, robe: true, trim: C.coreEdge, eyes: C.plasmaCore },
  zombie: { skin: C.coreEdge, head: 1, torso: C.trouser, torsoShade: C.coreCasing, legs: C.trouser, slump: true },
  'civilian-m': { skin: C.skinLight, head: 1, torso: C.trouser, torsoShade: C.hullBase, legs: C.metalMid, hair: C.metalDark },
  'civilian-f': { skin: C.skinLight, head: 1, torso: C.coatShadow, torsoShade: C.trouser, legs: C.trouser, hair: C.scorch },
  chryssalid: { creature: 'chryssalid' }, silacoid: { creature: 'silacoid' }, celatid: { creature: 'celatid' },
  reaper: { creature: 'reaper', big: true }, cyberdisc: { creature: 'cyberdisc', big: true }, sectopod: { creature: 'sectopod', big: true },
  'tank-cannon': { creature: 'tank', big: true, turret: C.metalMid }, 'tank-rocket': { creature: 'tank', big: true, turret: C.metalMid, rocket: true }, 'tank-laser': { creature: 'tank', big: true, turret: C.techAccentDeep },
  'hovertank-plasma': { creature: 'hover', big: true, turret: C.coreCasing }, 'hovertank-launcher': { creature: 'hover', big: true, turret: C.coreCasing, rocket: true },
};
const ANIMS = ['idle', 'walk0', 'walk1', 'fire', 'hit', 'fall0', 'fall1', 'dead', 'kneel'];
const HUMANOID_KNEEL = ['xcom-none', 'xcom-personal', 'xcom-power', 'xcom-flying', 'sectoid', 'floater', 'snakeman', 'muton', 'ethereal', 'zombie', 'civilian-m', 'civilian-f'];
function humanoid(name, cfg, facing, anim) {
  const parts = []; const bulk = cfg.bulk ?? 0; const short = cfg.short ?? 0; const tall = cfg.tall ?? 0;
  const lying = anim === 'dead'; const falling = anim === 'fall0' || anim === 'fall1'; const kneel = anim === 'kneel';
  const front = facing === 4, back = facing === 0, side = facing === 2, diag = facing === 1 || facing === 3;
  const dy = kneel ? 5 : falling ? (anim === 'fall0' ? 3 : 7) : 0; const legOff = anim === 'walk0' ? 2 : anim === 'walk1' ? -2 : 0; const recoil = anim === 'hit' ? (facing >= 3 ? -2 : 2) : 0;
  if (lying) { // horizontal body
    const g = `<g transform="translate(${16 + recoil},0) rotate(90 0 24) translate(-16,0)">`; parts.push(g);
  } else if (falling) parts.push(`<g transform="rotate(${anim === 'fall0' ? 25 : 60} 16 30)">`); else parts.push(`<g transform="translate(${recoil},0)">`);
  const hw = 10 + bulk, hx = 16 - hw / 2; const torsoY = 12 + short + dy, torsoH = 11 + tall - short - (kneel ? 2 : 0);
  // legs
  if (!cfg.hover && !cfg.tail) { const lh = kneel ? 4 : 7 - short; parts.push(rr(16 - hw / 2 + 1, torsoY + torsoH, 4, lh + (kneel ? 0 : 0), cfg.legs, 1)); parts.push(rr(16 + hw / 2 - 5, torsoY + torsoH + (side ? 0 : 0), 4, lh, cfg.legs, 1)); if (legOff) { parts.push(rr(16 - hw / 2 + 1, torsoY + torsoH + lh - 2, 4 + Math.abs(legOff), 2, cfg.legs, 1)); } }
  if (cfg.tail) parts.push(poly(`${16 - hw / 2},${torsoY + torsoH} ${16 + hw / 2},${torsoY + torsoH} ${24},${30} ${8},${30}`, cfg.legs));
  if (cfg.hover) { parts.push(rr(16 - hw / 2 + 1, torsoY + torsoH, hw - 2, 5, cfg.legs, 2)); parts.push(el(16, torsoY + torsoH + 6, hw / 2 - 1, 1.5, C.plasma)); }
  // torso
  if (cfg.robe) { parts.push(poly(`${hx},${torsoY} ${hx + hw},${torsoY} ${hx + hw + 2},${30 - dy} ${hx - 2},${30 - dy}`, cfg.torso)); parts.push(rr(15, torsoY + 2, 2, 14, cfg.trim, 1)); }
  else { parts.push(rr(hx, torsoY, hw, torsoH, cfg.torso, 2)); parts.push(rr(hx + 2, torsoY + 2, hw - 4, torsoH - 4, back ? cfg.torso : cfg.torsoShade, 1)); if (cfg.plates && !back) parts.push(rr(hx + 1, torsoY + 1, hw - 2, 3, cfg.plates, 1)); if (cfg.harness) parts.push(rr(hx, torsoY + torsoH / 2 - 1, hw, 2, cfg.harness, 0)); }
  if (cfg.thrusters) { parts.push(rr(hx - 3, torsoY + 4, 3, 5, C.metalMid, 1)); parts.push(rr(hx + hw, torsoY + 4, 3, 5, C.metalMid, 1)); parts.push(el(hx - 1.5, torsoY + 10, 1.5, 1.5, C.plasmaHot)); parts.push(el(hx + hw + 1.5, torsoY + 10, 1.5, 1.5, C.plasmaHot)); }
  // head
  const headR = 4.5 * (cfg.head ?? 1); const headY = torsoY - headR + 1; if (cfg.helmet) { parts.push(rr(16 - 5 - bulk / 2, headY - 5, 10 + bulk, 9, cfg.helmet, 3)); if (!back) parts.push(rr(16 - (side ? 1 : 3.5), headY - 1, side ? 4 : 7, 3, cfg.visor, 1)); }
  else { parts.push(el(16, headY, headR, headR * 0.95, cfg.skin)); if (cfg.hair && !front) parts.push(rr(16 - headR, headY - headR, headR * 2, headR * 0.8, cfg.hair, 2)); if (cfg.eyes && !back) { parts.push(el(16 - (side ? 0 : 1.6), headY - 0.5, 1.2, 0.9, cfg.eyes)); if (!side) parts.push(el(16 + 1.6, headY - 0.5, 1.2, 0.9, cfg.eyes)); } }
  // weapon
  if (cfg.weapon) { const raised = anim === 'fire'; const wx = facing <= 2 ? 16 + hw / 2 - 1 : 16 - hw / 2 - 7; const wy = torsoY + (raised ? 1 : 3); if (!back || raised) { parts.push(rr(wx, wy, 8, 3, cfg.weapon, 0.5)); parts.push(rr(wx + (facing <= 2 ? -2 : 6), wy + 1, 3, 5, cfg.grip, 0.5)); if (raised) parts.push(el(wx + (facing <= 2 ? 9 : -1), wy + 1.5, 1.5, 1.5, C.plasmaCore)); } }
  parts.push('</g>');
  return wrap(32, 32, parts.join(''));
}
function creature(name, cfg, facing, anim) {
  const big = cfg.big; const W = big ? 48 : 32; const parts = []; const lying = anim === 'dead'; const falling = anim.startsWith('fall'); const cx = W / 2, base = W - 4;
  if (lying) parts.push(`<g transform="rotate(75 ${cx} ${base})">`); else if (falling) parts.push(`<g transform="rotate(${anim === 'fall0' ? 20 : 45} ${cx} ${base})">`); else parts.push('<g>');
  const bob = anim === 'walk0' ? -1 : anim === 'walk1' ? 1 : 0; const hit = anim === 'hit' ? 2 : 0;
  switch (cfg.creature) {
    case 'chryssalid': { parts.push(rr(cx - 5, 12 + bob, 10, 12, C.alienOrganic, 3)); parts.push(el(cx, 10 + bob, 4, 4, C.coreCasing)); parts.push(el(cx - 1.5, 9 + bob, 1, 1, C.plasmaHot)); parts.push(el(cx + 1.5, 9 + bob, 1, 1, C.plasmaHot)); for (const s of [-1, 1]) { parts.push(poly(`${cx + s * 5},${14 + bob} ${cx + s * 12},${8 + bob + (anim === 'fire' ? -4 : 0)} ${cx + s * 11},${12 + bob}`, C.coreEdge)); parts.push(rr(cx + s * 5 - 1, 24, 3, 6, C.coreCasing, 1)); parts.push(rr(cx + s * 2 - 1, 24, 3, 6, C.coreCasing, 1)); } break; }
    case 'silacoid': { parts.push(el(cx, 24 + bob / 2, 11, 6, C.coreField)); parts.push(el(cx - 3, 22, 3, 2, C.plasmaHot)); parts.push(el(cx + 4, 25, 2, 1.5, C.plasmaHot)); parts.push(el(cx, 27, 10, 2, C.coreCasing)); break; }
    case 'celatid': { parts.push(el(cx, 16 + bob, 7, 9, C.alienOrganic)); parts.push(el(cx, 13 + bob, 5, 4, C.coreField)); parts.push(el(cx, 22 + bob, 3, 2, C.plasmaHot)); parts.push(el(cx, 28, 6, 1.5, C.coreCasing, ' opacity="0.5"')); break; }
    case 'reaper': { parts.push(rr(cx - 14, 18 + bob, 28, 14, C.coreCasing, 4)); parts.push(rr(cx - 10, 22 + bob, 20, 8, C.coreField, 3)); parts.push(el(cx + (facing <= 2 ? 12 : -12), 16 + bob, 6, 5, C.coreCasing)); parts.push(el(cx + (facing <= 2 ? 15 : -15), 15 + bob, 1.2, 1.2, C.plasmaHot)); for (const x of [-10, -3, 4, 11]) parts.push(rr(cx + x, 32, 4, 8 + (anim === 'walk0' && x < 0 ? 2 : anim === 'walk1' && x > 0 ? 2 : 0), C.coreCasing, 1)); break; }
    case 'cyberdisc': { parts.push(el(cx, 26, 20, 7, C.hullAlien)); parts.push(el(cx, 24, 20, 7, C.debris)); parts.push(el(cx, 24, 14, 4.5, C.hullBase)); parts.push(el(cx, 24, 17, 1.2, C.plasma)); parts.push(el(cx, 23, 4, 2.5, C.plasmaHot)); if (anim === 'fire') parts.push(el(cx + (facing <= 2 ? 18 : -18), 24, 2, 2, C.plasmaCore)); break; }
    case 'sectopod': { parts.push(rr(cx - 12, 10 + bob, 24, 14, C.hullAlien, 3)); parts.push(rr(cx - 9, 13 + bob, 18, 8, C.debris, 2)); parts.push(rr(cx - 3, 6 + bob, 6, 5, C.hullBase, 1)); parts.push(el(cx, 8 + bob, 2, 1.5, C.plasmaHot)); for (const s of [-1, 1]) { parts.push(poly(`${cx + s * 8},${24} ${cx + s * 18},${34} ${cx + s * 16},${36} ${cx + s * 6},${26}`, C.hullAlien)); parts.push(rr(cx + s * 16 - 2, 34 + (anim === 'walk0' ? s : anim === 'walk1' ? -s : 0), 4, 8, C.hullBase, 1)); } if (anim === 'fire') parts.push(rr(cx + (facing <= 2 ? 12 : -18), 14, 6, 3, C.plasmaCore, 1)); break; }
    case 'tank': case 'hover': { const hover = cfg.creature === 'hover'; parts.push(rr(cx - 16, 22 + bob, 32, 12, hover ? C.hullAlien : C.metalMid, 3)); parts.push(rr(cx - 14, 24 + bob, 28, 8, hover ? C.hullBase : C.metalDark, 2)); if (!hover) { parts.push(rr(cx - 17, 32, 34, 6, C.metalDark, 2)); parts.push(rr(cx - 15, 33, 30, 3, C.metalMid, 1)); } else parts.push(el(cx, 36, 14, 2, C.plasma)); parts.push(rr(cx - 8, 14 + bob, 16, 9, cfg.turret, 3)); parts.push(rr(cx + (facing <= 2 ? 6 : -20), 17 + bob, 14, 3, cfg.rocket ? C.metalDark : C.metalDark, 1)); if (cfg.rocket) parts.push(rr(cx + (facing <= 2 ? 6 : -20), 14 + bob, 14, 2, C.debris, 1)); parts.push(rr(cx - 3, 12 + bob, 6, 2, C.xcomVisor, 1)); break; }
  }
  parts.push('</g>');
  return wrap(W, W, parts.join(''));
}
export default function generate() {
  const out = [];
  for (const [body, cfg] of Object.entries(BODIES)) {
    const anims = cfg.creature ? ANIMS.filter((a) => a !== 'kneel') : HUMANOID_KNEEL.includes(body) ? ANIMS : ANIMS.filter((a) => a !== 'kneel');
    for (let f = 0; f <= 4; f++) for (const a of anims) out.push({ name: `unit/${body}/${f}/${a}`, svg: cfg.creature ? creature(body, cfg, f, a) : humanoid(body, cfg, f, a) });
  }
  const marks = { soldier: `<rect x="1" y="1" width="6" height="6" rx="1" fill="${C.coreEdge}"/>`, navigator: `<polygon points="4,0.5 7.5,7.5 0.5,7.5" fill="${C.coreEdge}"/>`, medic: `<rect x="3" y="0.5" width="2" height="7" fill="${C.coreEdge}"/><rect x="0.5" y="3" width="7" height="2" fill="${C.coreEdge}"/>`, engineer: `<circle cx="4" cy="4" r="3.5" fill="${C.coreEdge}"/><circle cx="4" cy="4" r="1.5" fill="${C.coreCasing}"/>`, leader: `<polygon points="4,0.5 7.5,4 4,7.5 0.5,4" fill="${C.coreEdge}"/>`, commander: `<polygon points="4,0.5 5,3 7.5,3 5.5,5 6.5,7.5 4,6 1.5,7.5 2.5,5 0.5,3 3,3" fill="${C.coreEdge}"/>`, terrorist: `<polygon points="0.5,7.5 4,0.5 7.5,7.5 4,5.5" fill="${C.alienOrganic}"/>` };
  for (const [k, v] of Object.entries(marks)) out.push({ name: `mark/${k}`, svg: wrap(8, 8, v) });
  const chevron = (n, star) => { let s = ''; for (let i = 0; i < n; i++) s += `<polygon points="3,${13 - i * 3} 8,${9 - i * 3} 13,${13 - i * 3} 13,${11 - i * 3} 8,${7 - i * 3} 3,${11 - i * 3}" fill="${C.xcomVisor}"/>`; if (star) s += `<circle cx="8" cy="4" r="2" fill="${C.xcomVisor}"/>`; return wrap(16, 16, s || `<rect x="6" y="7" width="4" height="2" fill="${C.xcomVisor}"/>`); };
  out.push({ name: 'rank/rookie', svg: chevron(0) }, { name: 'rank/squaddie', svg: chevron(1) }, { name: 'rank/sergeant', svg: chevron(2) }, { name: 'rank/captain', svg: chevron(3) }, { name: 'rank/colonel', svg: chevron(3, true) }, { name: 'rank/commander', svg: wrap(16, 16, `<polygon points="8,1 10,6 15,6 11,9 12.5,14.5 8,11.5 3.5,14.5 5,9 1,6 6,6" fill="${C.xcomVisor}"/>`) });
  return out;
}
