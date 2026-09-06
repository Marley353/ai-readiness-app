import { C, svg } from './_lib.mjs';
const plate = (s, body) => `<rect x="1" y="1" width="${s - 2}" height="${s - 2}" rx="3" fill="${C.hullBase}" stroke="${C.border}" stroke-width="1.5"/>${body}`;
const arcs = (cx, cy) => [6, 10, 14].map((r) => `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${C.techAccent}" stroke-width="1.5"/>`).join('');
export default function generate() {
  const M = {
    'access-lift': `<rect x="10" y="10" width="12" height="12" fill="${C.techAccentDeep}"/><polygon points="16,6 20,10 12,10" fill="${C.techAccent}"/><polygon points="16,26 20,22 12,22" fill="${C.techAccent}"/>`,
    'living-quarters': `<rect x="6" y="9" width="8" height="14" rx="1" fill="${C.debris}"/><rect x="18" y="9" width="8" height="14" rx="1" fill="${C.debris}"/><rect x="7" y="10" width="6" height="4" fill="${C.coatShadow}"/><rect x="19" y="10" width="6" height="4" fill="${C.coatShadow}"/>`,
    'general-stores': `<rect x="6" y="14" width="9" height="9" fill="${C.debris}"/><rect x="17" y="14" width="9" height="9" fill="${C.debris}"/><rect x="11" y="6" width="9" height="8" fill="${C.debris}"/><rect x="8" y="16" width="5" height="1.5" fill="${C.hullBase}"/><rect x="19" y="16" width="5" height="1.5" fill="${C.hullBase}"/>`,
    laboratory: `<path d="M13 6 L19 6 L19 13 L25 24 L7 24 L13 13 Z" fill="${C.techAccentDeep}"/><rect x="11" y="18" width="10" height="4" fill="${C.techAccent}"/>`,
    workshop: `<circle cx="16" cy="16" r="8" fill="${C.debris}"/><circle cx="16" cy="16" r="3.5" fill="${C.hullBase}"/><rect x="15" y="4" width="2" height="6" fill="${C.debris}"/><rect x="15" y="22" width="2" height="6" fill="${C.debris}"/><rect x="4" y="15" width="6" height="2" fill="${C.debris}"/><rect x="22" y="15" width="6" height="2" fill="${C.debris}"/>`,
    'small-radar': `${arcs(16, 22)}<circle cx="16" cy="22" r="2" fill="${C.techAccent}"/>`,
    'large-radar': `${arcs(16, 24)}<circle cx="16" cy="24" r="2.5" fill="${C.techAccent}"/><path d="M4 24 A12 12 0 0 1 28 24" fill="none" stroke="${C.techAccent}" stroke-width="1.5" opacity="0.6"/>`,
    'missile-defences': `<rect x="14" y="6" width="4" height="14" rx="2" fill="${C.debris}"/><polygon points="16,3 19,7 13,7" fill="${C.critical}"/><rect x="8" y="20" width="16" height="6" rx="1" fill="${C.metalMid}"/>`,
    'laser-defences': `<rect x="14" y="6" width="4" height="14" rx="1" fill="${C.debris}"/><rect x="15" y="4" width="2" height="4" fill="${C.techAccent}"/><rect x="8" y="20" width="16" height="6" rx="1" fill="${C.metalMid}"/>`,
    'plasma-defences': `<rect x="13" y="6" width="6" height="14" rx="2" fill="${C.coreCasing}"/><circle cx="16" cy="6" r="3" fill="${C.plasmaHot}"/><rect x="8" y="20" width="16" height="6" rx="1" fill="${C.hullAlien}"/>`,
    'fusion-ball-defences': `<circle cx="16" cy="12" r="6" fill="${C.coreField}"/><circle cx="16" cy="12" r="2.5" fill="${C.coreCentre}"/><rect x="8" y="20" width="16" height="6" rx="1" fill="${C.hullAlien}"/>`,
    'grav-shield': `<path d="M6 16 A10 10 0 0 1 26 16" fill="none" stroke="${C.techAccent}" stroke-width="2"/><path d="M9 20 A7 7 0 0 1 23 20" fill="none" stroke="${C.techAccent}" stroke-width="2" opacity="0.6"/><rect x="12" y="22" width="8" height="4" fill="${C.debris}"/>`,
    'mind-shield': `<polygon points="16,5 26,10 26,20 16,27 6,20 6,10" fill="${C.coreCasing}" stroke="${C.coreEdge}" stroke-width="1.5"/><circle cx="16" cy="16" r="4" fill="${C.alienOrganic}"/>`,
    'psionic-laboratory': `<circle cx="16" cy="14" r="7" fill="${C.coreCasing}"/><circle cx="16" cy="14" r="3" fill="${C.alienOrganic}"/><circle cx="16" cy="14" r="10" fill="none" stroke="${C.coreEdge}" stroke-width="1.5"/><rect x="12" y="22" width="8" height="5" fill="${C.debris}"/>`,
    'hyper-wave-decoder': `${arcs(16, 20)}<rect x="12" y="20" width="8" height="6" fill="${C.coreCasing}"/><circle cx="16" cy="23" r="1.5" fill="${C.coreCentre}"/>`,
    'alien-containment': `<rect x="7" y="7" width="18" height="18" rx="2" fill="${C.coreCasing}" stroke="${C.coreEdge}" stroke-width="1"/><rect x="11" y="9" width="2" height="14" fill="${C.alienOrganic}"/><rect x="15" y="9" width="2" height="14" fill="${C.alienOrganic}"/><rect x="19" y="9" width="2" height="14" fill="${C.alienOrganic}"/>`,
  };
  const out = Object.entries(M).map(([id, body]) => ({ name: `facility/${id}`, svg: svg(32, 32, plate(32, body)) }));
  out.push({ name: 'facility/hangar', svg: svg(64, 64, plate(64, `<rect x="10" y="12" width="44" height="40" rx="3" fill="${C.hullAlien}"/><rect x="14" y="16" width="36" height="32" rx="2" fill="${C.hullBase}"/><polygon points="32,20 44,44 36,42 32,46 28,42 20,44" fill="${C.hullBase}" stroke="${C.techAccent}" stroke-width="1.5"/>`)) });
  out.push({ name: 'facility/construction', svg: svg(32, 32, `<rect x="2" y="2" width="28" height="28" rx="3" fill="none" stroke="${C.warn}" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="8" y="20" width="16" height="3" fill="${C.warn}"/><rect x="14" y="8" width="3" height="14" fill="${C.warn}"/><rect x="14" y="8" width="10" height="2" fill="${C.warn}"/>`) });
  out.push({ name: 'facility/empty', svg: svg(32, 32, `<rect x="2" y="2" width="28" height="28" rx="3" fill="none" stroke="${C.shell3}" stroke-width="1" stroke-dasharray="2 4"/>`) });
  return out;
}
