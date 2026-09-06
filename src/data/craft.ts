import type { CraftTypeDef, CraftWeaponDef } from './types';
// Speeds in knots, fuel in units (Elerium units for alien-powered craft), damage capacity, capacities and prices from the original.
export const CRAFT: Record<string, CraftTypeDef> = {
  skyranger: { id: 'skyranger', name: 'Skyranger', speedMax: 760, acceleration: 2, fuelMax: 1500, damageMax: 150, weapons: 0, soldiers: 14, hwps: 3, costBuy: 500000, rentMonthly: 500000, refuelRate: 50, repairRate: 1, radarRange: 672, sprite: 'craft/skyranger', transferHours: 72 },
  interceptor: { id: 'interceptor', name: 'Interceptor', speedMax: 2100, acceleration: 3, fuelMax: 1000, damageMax: 100, weapons: 2, soldiers: 0, hwps: 0, costBuy: 600000, rentMonthly: 600000, refuelRate: 50, repairRate: 1, radarRange: 672, sprite: 'craft/interceptor', transferHours: 72 },
  firestorm: { id: 'firestorm', name: 'Firestorm', speedMax: 4300, acceleration: 9, fuelMax: 20, fuelItem: 'elerium-115', damageMax: 50, weapons: 2, soldiers: 0, hwps: 0, refuelRate: 1, repairRate: 1, radarRange: 672, sprite: 'craft/firestorm', requiresResearch: 'new-fighter-craft' },
  lightning: { id: 'lightning', name: 'Lightning', speedMax: 3100, acceleration: 9, fuelMax: 30, fuelItem: 'elerium-115', damageMax: 800, weapons: 1, soldiers: 12, hwps: 0, refuelRate: 1, repairRate: 1, radarRange: 672, sprite: 'craft/lightning', requiresResearch: 'new-fighter-transporter' },
  avenger: { id: 'avenger', name: 'Avenger', speedMax: 5400, acceleration: 10, fuelMax: 60, fuelItem: 'elerium-115', damageMax: 1200, weapons: 2, soldiers: 26, hwps: 4, refuelRate: 1, repairRate: 1, radarRange: 672, sprite: 'craft/avenger', requiresResearch: 'ultimate-craft' },
};
export const CRAFT_WEAPONS: Record<string, CraftWeaponDef> = {
  stingray: { id: 'stingray', name: 'Stingray', damage: 70, range: 30, accuracy: 70, reloadCautious: 32, reloadStandard: 24, reloadAggressive: 16, ammoMax: 6, ammoItem: 'stingray-missiles', rearmRate: 1, storeItem: 'stingray-launcher', sprite: 'item/stingray-launcher' },
  avalanche: { id: 'avalanche', name: 'Avalanche', damage: 100, range: 60, accuracy: 80, reloadCautious: 48, reloadStandard: 36, reloadAggressive: 24, ammoMax: 3, ammoItem: 'avalanche-missiles', rearmRate: 1, storeItem: 'avalanche-launcher', sprite: 'item/avalanche-launcher' },
  cannon: { id: 'cannon', name: 'Cannon', damage: 10, range: 10, accuracy: 25, reloadCautious: 2, reloadStandard: 2, reloadAggressive: 2, ammoMax: 200, ammoItem: 'cannon-rounds', rearmRate: 100, storeItem: 'cannon', sprite: 'item/cannon' },
  'laser-cannon': { id: 'laser-cannon', name: 'Laser Cannon', damage: 70, range: 21, accuracy: 35, reloadCautious: 12, reloadStandard: 12, reloadAggressive: 12, ammoMax: 99, rearmRate: 99, storeItem: 'laser-cannon', sprite: 'item/laser-cannon' },
  'plasma-beam': { id: 'plasma-beam', name: 'Plasma Beam', damage: 140, range: 52, accuracy: 50, reloadCautious: 12, reloadStandard: 12, reloadAggressive: 12, ammoMax: 100, rearmRate: 100, storeItem: 'plasma-beam', sprite: 'item/plasma-beam' },
  'fusion-ball': { id: 'fusion-ball', name: 'Fusion Ball Launcher', damage: 230, range: 65, accuracy: 100, reloadCautious: 32, reloadStandard: 24, reloadAggressive: 16, ammoMax: 2, ammoItem: 'fusion-ball', rearmRate: 1, storeItem: 'fusion-ball-launcher', sprite: 'item/fusion-ball-launcher' },
};
export const craftDef = (id: string) => CRAFT[id];
export const craftWeaponDef = (id: string) => CRAFT_WEAPONS[id];
export const craftWeaponForItem = (itemId: string) => Object.values(CRAFT_WEAPONS).find((w) => w.storeItem === itemId);
