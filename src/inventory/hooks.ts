import { hooks } from '../app/testHooks';
import { getState } from '../core/state';
import { ITEMS } from '../data/items';
import { fits, tuMove, occupiedCells } from './layout';
import { loadoutFor } from './loadout';
import { generateSoldier, applyMissionExperience, promote } from '../soldiers/roster';
import { campaignRng, nextId } from '../core/campaign';
export function installInventoryHooks() {
  hooks.add('inventory', {
    equip: (soldierId: number, slot: any, itemId: string, gx = 0, gy = 0) => { const s = getState(); const so = s.soldiers.find((x) => x.id === soldierId); const d = ITEMS[itemId]; if (!so || !d) return { ok: false, reason: 'NO SOLDIER OR ITEM' }; const b = s.bases.find((x) => x.id === so.baseId); const craft = s.craft.find((c) => c.id === so.craftId); const pool = craft && (craft.items[itemId] ?? 0) > 0 ? craft.items : b?.items; if (!pool || (pool[itemId] ?? 0) <= 0) return { ok: false, reason: 'NOT IN STORES' }; const occ = occupiedCells(so.equipment.map((e) => ({ ...e, size: ITEMS[e.def].size })), slot); if (slot !== 'rightHand' && slot !== 'leftHand' && !fits(d, slot, gx, gy, occ)) return { ok: false, reason: 'DOES NOT FIT' }; if ((slot === 'rightHand' || slot === 'leftHand') && so.equipment.some((e) => e.slot === slot)) return { ok: false, reason: 'HAND OCCUPIED' }; pool[itemId]--; const ammo = d.ammo?.[0]; let rounds: number | undefined; if (ammo && pool[ammo] > 0) { pool[ammo]--; rounds = ITEMS[ammo].clipSize; } so.equipment.push({ slot, def: itemId, gx, gy, ammo: ammo && rounds ? ammo : undefined, rounds }); return { ok: true }; },
    unequip: (soldierId: number, slot: any, gx = 0, gy = 0) => { const s = getState(); const so = s.soldiers.find((x) => x.id === soldierId); if (!so) return { ok: false }; const i = so.equipment.findIndex((e) => e.slot === slot && (e.gx ?? 0) === gx && (e.gy ?? 0) === gy); if (i < 0) return { ok: false, reason: 'EMPTY' }; const e = so.equipment.splice(i, 1)[0]; const b = s.bases.find((x) => x.id === so.baseId)!; b.items[e.def] = (b.items[e.def] ?? 0) + 1; if (e.ammo) b.items[e.ammo] = (b.items[e.ammo] ?? 0) + 1; return { ok: true }; },
    fits: (itemId: string, slot: any, gx: number, gy: number) => fits(ITEMS[itemId], slot, gx, gy),
    tu: (from: any, to: any) => tuMove(from, to),
    loadout: (soldierId: number) => { const so = getState().soldiers.find((x) => x.id === soldierId); return so ? loadoutFor(so) : null; },
  });
  hooks.add('soldiers', { generate: () => { const s = getState(); const rng = campaignRng(s); const so = generateSoldier(rng, nextId(s), s.bases[0]?.id ?? 0, s.time); rng.save(); s.soldiers.push(so); return so; }, growth: (soldierId: number, exp: any) => { const s = getState(); const so = s.soldiers.find((x) => x.id === soldierId)!; const rng = campaignRng(s); applyMissionExperience(so, { exp, kills: 0 } as any, rng); rng.save(); return so.stats; }, promote: () => promote(getState()), memorial: () => getState().memorial });
}
