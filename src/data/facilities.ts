import type { FacilityDef } from './types';
const f = (id: string, name: string, buildDays: number, cost: number, maintenance: number, o: Partial<FacilityDef> = {}): FacilityDef => ({ id, name, size: 1, buildDays, cost, maintenance, sprite: `facility/${id}`, ...o });
export const FACILITIES: Record<string, FacilityDef> = {
  'access-lift': f('access-lift', 'Access Lift', 6, 300000, 4000, { lift: true }),
  'living-quarters': f('living-quarters', 'Living Quarters', 16, 400000, 10000, { personnel: 50 }),
  'general-stores': f('general-stores', 'General Stores', 10, 150000, 5000, { stores: 50 }),
  laboratory: f('laboratory', 'Laboratory', 26, 750000, 30000, { labs: 50 }),
  workshop: f('workshop', 'Workshop', 32, 800000, 35000, { workshops: 50 }),
  'small-radar': f('small-radar', 'Small Radar System', 12, 500000, 10000, { radarRange: 1500, radarChance: 10 }),
  'large-radar': f('large-radar', 'Large Radar System', 25, 800000, 15000, { radarRange: 2250, radarChance: 20 }),
  'missile-defences': f('missile-defences', 'Missile Defences', 16, 200000, 5000, { defenceDamage: 500, defenceHit: 50 }),
  'laser-defences': f('laser-defences', 'Laser Defences', 24, 400000, 10000, { defenceDamage: 600, defenceHit: 60, requiresResearch: 'laser-defences' }),
  'plasma-defences': f('plasma-defences', 'Plasma Defences', 34, 600000, 12000, { defenceDamage: 900, defenceHit: 70, requiresResearch: 'plasma-defences' }),
  'fusion-ball-defences': f('fusion-ball-defences', 'Fusion Ball Defences', 34, 800000, 14000, { defenceDamage: 1200, defenceHit: 80, requiresResearch: 'fusion-defences' }),
  'grav-shield': f('grav-shield', 'Grav Shield', 38, 1200000, 15000, { requiresResearch: 'grav-shield' }),
  'mind-shield': f('mind-shield', 'Mind Shield', 33, 1300000, 5000, { mindShield: true, requiresResearch: 'mind-shield' }),
  'psionic-laboratory': f('psionic-laboratory', 'Psionic Laboratory', 24, 750000, 16000, { psiLab: 10, requiresResearch: 'psionic-laboratory' }),
  'hyper-wave-decoder': f('hyper-wave-decoder', 'Hyper-wave Decoder', 26, 1400000, 30000, { radarRange: 2400, radarChance: 100, hyperwave: true, requiresResearch: 'hyper-wave-decoder' }),
  'alien-containment': f('alien-containment', 'Alien Containment', 18, 400000, 15000, { aliens: 10 }),
  hangar: f('hangar', 'Hangar', 25, 200000, 25000, { size: 2, hangars: 1 }),
};
export const facilityDef = (id: string) => FACILITIES[id];
export const allFacilities = () => Object.values(FACILITIES);
