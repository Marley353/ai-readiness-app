// Semantic palette — the only place hex values live for Pixi. Mirrors src/design/tokens.css.
// Cyan/sky = technology & energy (both sides). Violet/indigo = alien organic & alien-manufactured.
// Olive green = X-COM personnel. Slate = structure & metal. Never cross these.
export const P = {
  // X-COM personnel — combat
  xcomHelmet: 0x2d4a22, xcomVisor: 0x48bb78, xcomArmour: 0x3f6212, xcomArmourShadow: 0x1e3a1e, xcomBoots: 0x1f2937,
  // X-COM personnel — support
  skinLight: 0xfbcfe8, coat: 0xf8fafc, coatShadow: 0xe2e8f0, trouser: 0x334155,
  // Weapons and hardware
  metalDark: 0x111827, metalMid: 0x374151, hullBase: 0x1e293b, hullAlien: 0x475569, debris: 0x64748b,
  // Energy and alien tech
  techAccent: 0x38bdf8, techAccentDeep: 0x0284c7, plasma: 0x06b6d4, plasmaHot: 0x22d3ee, plasmaCore: 0x67e8f9,
  coreCasing: 0x1e1b4b, coreEdge: 0x818cf8, coreField: 0x6366f1, coreCentre: 0xa5f3fc, alienOrganic: 0xa855f7,
  // Terrain
  scorch: 0x451a03,
  // UI shell (dark slate / indigo), derived from the same family
  shell0: 0x0b1020, shell1: 0x111827, shell2: 0x1e293b, shell3: 0x334155, border: 0x475569,
  text: 0xf8fafc, textMuted: 0x94a3b8, textDim: 0x8593a5,
  accent: 0x38bdf8, accentDeep: 0x0369a1, warn: 0xf59e0b, warnDeep: 0xb45309, critical: 0xef4444, criticalDeep: 0x991b1b, ok: 0x48bb78,
  // Terrain family (flat vector ground / vegetation / structure)
  grass: 0x4d7c0f, grassShade: 0x3f6212, soil: 0x78350f, soilShade: 0x451a03, sand: 0xd6b26a, sandShade: 0xb8933f,
  snow: 0xe2e8f0, snowShade: 0xcbd5e1, forest: 0x166534, forestShade: 0x14532d, jungle: 0x15803d, jungleShade: 0x166534,
  wood: 0x92400e, woodShade: 0x78350f, concrete: 0x94a3b8, concreteShade: 0x64748b, asphalt: 0x334155, asphaltShade: 0x1e293b,
  brick: 0x9a3412, brickShade: 0x7c2d12, roof: 0x475569, roofShade: 0x334155, glass: 0x38bdf8, water: 0x0369a1, waterShade: 0x075985,
  alienWall: 0x312e81, alienWallShade: 0x1e1b4b, alienFloor: 0x3730a3, alienFloorShade: 0x312e81,
  ufoWall: 0x475569, ufoWallShade: 0x334155, ufoFloor: 0x64748b, ufoFloorShade: 0x475569,
  smoke: 0x94a3b8, fire: 0xf97316, fireCore: 0xfde047, stunCloud: 0xa5f3fc, psi: 0xa855f7, night: 0x0b1020,
} as const;
export type PaletteKey = keyof typeof P;
export const paletteHex = (k: PaletteKey) => '#' + P[k].toString(16).padStart(6, '0');
