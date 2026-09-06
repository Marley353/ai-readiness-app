import { C, svg } from './_lib.mjs';
const poly = (pts, fill, o = '') => `<polygon points="${pts}" fill="${fill}"${o}/>`;
const circ = (cx, cy, r, fill, o = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${o}/>`;
const burst = (n, r1, r2, cx = 16, cy = 16) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * 2 * i) / (n * 2); const r = i % 2 ? r1 : r2; pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`); } return pts.join(' '); };
export default function generate() {
  const out = [];
  out.push({ name: 'fx/bullet', svg: svg(32, 32, `<rect x="13" y="15" width="6" height="2" rx="1" fill="${C.debris}"/>`) });
  out.push({ name: 'fx/laser', svg: svg(32, 32, `<rect x="0" y="14" width="32" height="4" rx="2" fill="${C.techAccent}"/><rect x="0" y="15" width="32" height="2" fill="${C.plasmaCore}"/>`) });
  out.push({ name: 'fx/plasma', svg: svg(32, 32, `${circ(16, 16, 7, C.plasma, ' opacity="0.4"')}${circ(16, 16, 4, C.plasmaHot)}${circ(16, 16, 2, C.plasmaCore)}`) });
  out.push({ name: 'fx/rocket', svg: svg(32, 32, `<rect x="8" y="14" width="16" height="4" rx="2" fill="${C.metalMid}"/><polygon points="24,12 30,16 24,20" fill="${C.debris}"/><circle cx="7" cy="16" r="3" fill="${C.fire}"/>`) });
  out.push({ name: 'fx/blaster', svg: svg(32, 32, `${circ(16, 16, 8, C.coreField, ' opacity="0.5"')}${circ(16, 16, 5, C.plasmaHot)}${circ(16, 16, 2.5, C.plasmaCore)}`) });
  for (let i = 0; i < 6; i++) { const r = 4 + i * 2.2; out.push({ name: `fx/explosion${i}`, svg: svg(32, 32, `${poly(burst(8, r * 0.6, r), i < 4 ? C.fire : C.smoke, i >= 4 ? ' opacity="0.7"' : '')}${i < 4 ? poly(burst(6, r * 0.3, r * 0.55), C.fireCore) : ''}`) }); }
  for (let i = 0; i < 4; i++) out.push({ name: `fx/smoke${i}`, svg: svg(32, 32, `${circ(11, 20 - i, 6 + i, C.smoke, ' opacity="0.7"')}${circ(20, 18 - i, 7 + i, C.smoke, ' opacity="0.7"')}${circ(15, 12 - i, 5 + i, C.smoke, ' opacity="0.6"')}`) });
  for (let i = 0; i < 3; i++) out.push({ name: `fx/fire${i}`, svg: svg(32, 32, `${poly(`8,30 ${12 - i},18 14,22 16,${8 + i * 2} 20,20 ${22 + i},14 26,30`, C.fire)}${poly(`13,30 15,22 17,26 19,18 21,30`, C.fireCore)}`) });
  for (let i = 0; i < 3; i++) out.push({ name: `fx/stun${i}`, svg: svg(32, 32, `${circ(16, 18, 9 + i * 2, C.stunCloud, ' opacity="0.45"')}${circ(12, 16, 5, C.stunCloud, ' opacity="0.5"')}${circ(21, 15, 5, C.stunCloud, ' opacity="0.5"')}`) });
  for (let i = 0; i < 3; i++) out.push({ name: `fx/psi${i}`, svg: svg(32, 32, `<circle cx="16" cy="16" r="${6 + i * 4}" fill="none" stroke="${C.alienOrganic}" stroke-width="2" opacity="${0.9 - i * 0.25}"/>${circ(16, 16, 3, C.alienOrganic)}`) });
  out.push({ name: 'fx/flare', svg: svg(32, 32, `${circ(16, 20, 9, C.warn, ' opacity="0.35"')}${circ(16, 20, 4, C.fireCore)}<rect x="15" y="22" width="2" height="8" fill="${C.metalMid}"/>`) });
  out.push({ name: 'fx/hit', svg: svg(32, 32, poly(burst(6, 3, 8), C.critical)) });
  out.push({ name: 'fx/muzzle', svg: svg(32, 32, poly(burst(5, 2, 7, 16, 16), C.fireCore)) });
  out.push({ name: 'fx/impact-wall', svg: svg(32, 32, `${poly(burst(7, 3, 8), C.debris)}${circ(16, 16, 2, C.smoke)}`) });
  // geoscape markers
  const geo = (body) => svg(16, 16, body);
  out.push({ name: 'geo/base', svg: geo(`<rect x="2" y="2" width="12" height="12" rx="2" fill="${C.hullBase}" stroke="${C.techAccent}" stroke-width="1.5"/><rect x="6" y="6" width="4" height="4" fill="${C.techAccent}"/>`) });
  out.push({ name: 'geo/ufo', svg: geo(`<ellipse cx="8" cy="9" rx="7" ry="3.5" fill="${C.hullAlien}"/><ellipse cx="8" cy="7" rx="3.5" ry="2.5" fill="${C.alienOrganic}"/><ellipse cx="8" cy="10" rx="5" ry="1" fill="${C.plasmaHot}"/>`) });
  out.push({ name: 'geo/ufo-landed', svg: geo(`<ellipse cx="8" cy="10" rx="7" ry="3.5" fill="${C.hullAlien}"/><ellipse cx="8" cy="8" rx="3.5" ry="2.5" fill="${C.alienOrganic}"/><rect x="2" y="13" width="12" height="1.5" fill="${C.coreEdge}"/>`) });
  out.push({ name: 'geo/crash', svg: geo(`<ellipse cx="8" cy="12" rx="7" ry="2.5" fill="${C.scorch}" opacity="0.7"/><path d="M3 11 Q8 5 13 11 Q8 13 3 11 Z" fill="${C.hullAlien}"/><circle cx="8" cy="9" r="1.8" fill="${C.plasmaCore}"/><circle cx="8" cy="9" r="3" fill="${C.plasma}" opacity="0.35"/>`) });
  out.push({ name: 'geo/terror', svg: geo(`<polygon points="8,1 15,14 1,14" fill="${C.critical}"/><rect x="7" y="6" width="2" height="4" fill="${C.text}"/><rect x="7" y="11" width="2" height="2" fill="${C.text}"/>`) });
  out.push({ name: 'geo/alien-base', svg: geo(`<polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="${C.coreCasing}" stroke="${C.coreEdge}" stroke-width="1.2"/><circle cx="8" cy="8" r="2.5" fill="${C.coreCentre}"/>`) });
  out.push({ name: 'geo/craft', svg: geo(`<polygon points="8,1 14,12 10,11 8,14 6,11 2,12" fill="${C.hullBase}" stroke="${C.techAccent}" stroke-width="1"/>`) });
  out.push({ name: 'geo/waypoint', svg: geo(`<circle cx="8" cy="8" r="5" fill="none" stroke="${C.techAccent}" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="${C.techAccent}"/>`) });
  return out;
}
