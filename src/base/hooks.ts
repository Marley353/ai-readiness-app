import { hooks } from '../app/testHooks';
import { getState } from '../core/state';
import { build, buyItem, sell, hire, equipCraftWeapon, assignSoldier, loadCraftItem, storesOver, makeCraft } from './sim';
import { addBase } from '../core/campaign';
export function installBaseHooks() {
  hooks.add('base', {
    build: (baseId: number, facilityId: string, x: number, y: number) => build(getState(), baseId, facilityId, x, y),
    buy: (baseId: number, itemId: string, qty: number) => buyItem(getState(), baseId, itemId, qty),
    sell: (baseId: number, itemId: string, qty: number) => sell(getState(), baseId, itemId, qty),
    hire: (baseId: number, kind: any, n: number) => hire(getState(), baseId, kind, n),
    equipCraft: (craftId: number, slot: number, weaponId: string | null) => equipCraftWeapon(getState(), craftId, slot, weaponId),
    assignSoldier: (soldierId: number, craftId: number | null) => assignSoldier(getState(), soldierId, craftId),
    loadCraftItem: (craftId: number, itemId: string, qty: number) => loadCraftItem(getState(), craftId, itemId, qty),
    storesOver: (baseId: number) => { const b = getState().bases.find((x) => x.id === baseId); return b ? storesOver(getState(), b) : false; },
    newBase: (lon: number, lat: number, name: string) => addBase(getState(), lon, lat, name),
    addCraft: (type: string, baseId: number) => makeCraft(getState(), type, baseId),
  });
}
