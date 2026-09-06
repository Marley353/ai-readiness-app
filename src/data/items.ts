// Item rules — values from the 1994 original (UFOpaedia / OpenXcom vanilla rulesets). Prices in $.
import type { ItemDef, ShotMode, DamageType, ArmourDef, UnitStats } from './types';

const m = (tu: number, accuracy: number, shots?: number): ShotMode => (shots ? { tu, accuracy, shots } : { tu, accuracy });
type Partial_ = Partial<ItemDef> & { id: string; name: string };
const base = (p: Partial_): ItemDef => ({
  category: 'other', battleType: 'none', size: { w: 1, h: 1 }, weight: 1, costSell: 0, storeSize: 0.1, sprite: `item/${p.id}`, ...p,
} as ItemDef);
const weapon = (p: Partial_) => base({ category: 'weapon', battleType: 'firearm', storeSize: 0.2, ...p });
const ammo = (p: Partial_) => base({ category: 'ammo', battleType: 'ammo', size: { w: 1, h: 1 }, weight: 3, storeSize: 0.1, ...p });
const grenade = (p: Partial_) => base({ category: 'grenade', battleType: 'grenade', damageType: 'he', weight: 3, storeSize: 0.1, primeTu: 50, throwTu: 25, ...p });
const armourDef = (front: number, left: number, right: number, rear: number, under: number, unitSprite: string, flying = false): ArmourDef => ({ values: { front, left, right, rear, under }, damageMod: { stun: 1, smoke: 1 }, flying, unitSprite });
const hwpStats = (tu: number, health: number, reactions: number, firing: number): UnitStats => ({ tu, stamina: 100, health, bravery: 110, reactions, firing, throwing: 0, strength: 60, psiStrength: 100, psiSkill: 0, melee: 0 });
const artefact = (p: Partial_) => base({ category: 'artefact', battleType: 'none', alienArtefact: true, storeSize: 1, ...p });
const corpse = (race: string, name: string, sell: number, weight = 30) => base({ id: `${race}-corpse`, name, category: 'corpse', battleType: 'corpse', size: { w: 2, h: 3 }, weight, costSell: sell, storeSize: 0.4, race, sprite: `item/${race}-corpse`, recoveryScore: 3 });
const live = (race: string, rank: string, name: string, value: number) => base({ id: `${race}-${rank}`, name, category: 'live-alien', battleType: 'none', liveAlien: true, race, costSell: 0, storeSize: 1, sprite: `item/${race}-live`, recoveryScore: value, requiresResearch: undefined });

const list: ItemDef[] = [
  // Conventional
  weapon({ id: 'pistol', name: 'Pistol', size: { w: 1, h: 2 }, weight: 5, costBuy: 800, costSell: 600, snap: m(18, 60), aimed: m(30, 78), ammo: ['pistol-clip'] }),
  ammo({ id: 'pistol-clip', name: 'Pistol Clip', damage: 26, damageType: 'ap', clipSize: 12, weight: 3, costBuy: 70, costSell: 52 }),
  weapon({ id: 'rifle', name: 'Rifle', size: { w: 1, h: 3 }, weight: 8, twoHanded: true, costBuy: 3000, costSell: 2250, snap: m(25, 60), aimed: m(80, 110), auto: m(35, 35, 3), ammo: ['rifle-clip'] }),
  ammo({ id: 'rifle-clip', name: 'Rifle Clip', damage: 30, damageType: 'ap', clipSize: 20, weight: 3, costBuy: 200, costSell: 150 }),
  weapon({ id: 'heavy-cannon', name: 'Heavy Cannon', size: { w: 2, h: 3 }, weight: 18, twoHanded: true, costBuy: 6400, costSell: 4800, snap: m(33, 60), aimed: m(80, 90), ammo: ['hc-ap-ammo', 'hc-he-ammo', 'hc-in-ammo'] }),
  ammo({ id: 'hc-ap-ammo', name: 'HC-AP Ammo', damage: 56, damageType: 'ap', clipSize: 6, weight: 6, costBuy: 300, costSell: 225 }),
  ammo({ id: 'hc-he-ammo', name: 'HC-HE Ammo', damage: 52, damageType: 'he', clipSize: 6, weight: 6, costBuy: 500, costSell: 375, blastRadius: 2 }),
  ammo({ id: 'hc-in-ammo', name: 'HC-IN Ammo', damage: 60, damageType: 'incendiary', clipSize: 6, weight: 6, costBuy: 400, costSell: 300, blastRadius: 2 }),
  weapon({ id: 'auto-cannon', name: 'Auto-Cannon', size: { w: 2, h: 3 }, weight: 19, twoHanded: true, costBuy: 13500, costSell: 10125, snap: m(33, 56), aimed: m(80, 82), auto: m(40, 32, 3), ammo: ['ac-ap-ammo', 'ac-he-ammo', 'ac-in-ammo'] }),
  ammo({ id: 'ac-ap-ammo', name: 'AC-AP Ammo', damage: 42, damageType: 'ap', clipSize: 14, weight: 5, costBuy: 500, costSell: 375 }),
  ammo({ id: 'ac-he-ammo', name: 'AC-HE Ammo', damage: 44, damageType: 'he', clipSize: 14, weight: 5, costBuy: 700, costSell: 525, blastRadius: 2 }),
  ammo({ id: 'ac-in-ammo', name: 'AC-IN Ammo', damage: 48, damageType: 'incendiary', clipSize: 14, weight: 5, costBuy: 650, costSell: 487, blastRadius: 2 }),
  weapon({ id: 'rocket-launcher', name: 'Rocket Launcher', size: { w: 2, h: 3 }, weight: 10, twoHanded: true, costBuy: 4000, costSell: 3000, snap: m(45, 55), aimed: m(75, 115), ammo: ['small-rocket', 'large-rocket', 'incendiary-rocket'] }),
  ammo({ id: 'small-rocket', name: 'Small Rocket', damage: 75, damageType: 'he', clipSize: 1, size: { w: 1, h: 3 }, weight: 6, costBuy: 600, costSell: 450, blastRadius: 3 }),
  ammo({ id: 'large-rocket', name: 'Large Rocket', damage: 100, damageType: 'he', clipSize: 1, size: { w: 1, h: 3 }, weight: 8, costBuy: 900, costSell: 675, blastRadius: 5 }),
  ammo({ id: 'incendiary-rocket', name: 'Incendiary Rocket', damage: 90, damageType: 'incendiary', clipSize: 1, size: { w: 1, h: 3 }, weight: 8, costBuy: 1200, costSell: 900, blastRadius: 4 }),
  grenade({ id: 'grenade', name: 'Grenade', damage: 50, blastRadius: 2, costBuy: 300, costSell: 225 }),
  grenade({ id: 'smoke-grenade', name: 'Smoke Grenade', damage: 60, damageType: 'smoke', blastRadius: 3, costBuy: 150, costSell: 112 }),
  grenade({ id: 'proximity-grenade', name: 'Proximity Grenade', battleType: 'proximity', damage: 70, blastRadius: 3, costBuy: 500, costSell: 375 }),
  grenade({ id: 'high-explosive', name: 'High Explosive', damage: 110, blastRadius: 5, size: { w: 2, h: 1 }, weight: 6, costBuy: 1500, costSell: 1125 }),
  base({ id: 'electro-flare', name: 'Electro-flare', category: 'equipment', battleType: 'flare', weight: 3, costBuy: 60, costSell: 45, throwTu: 25 }),
  weapon({ id: 'stun-rod', name: 'Stun Rod', battleType: 'melee', size: { w: 1, h: 3 }, weight: 6, costBuy: 1260, costSell: 945, melee: m(30, 100), damage: 65, damageType: 'stun' }),
  base({ id: 'motion-scanner', name: 'Motion Scanner', category: 'equipment', battleType: 'scanner', weight: 3, costSell: 45600, useTu: 25, requiresResearch: 'motion-scanner' }),
  base({ id: 'medi-kit', name: 'Medi-Kit', category: 'equipment', battleType: 'medikit', size: { w: 1, h: 2 }, weight: 5, costSell: 46500, requiresResearch: 'medi-kit', medikit: { heal: 10, stimulant: 10, painkiller: 10, healTu: 10, stimTu: 10, painTu: 10, healAmount: 3, stimAmount: 15, painAmount: 30 } }),
  base({ id: 'psi-amp', name: 'Psi-Amp', category: 'equipment', battleType: 'psiamp', size: { w: 1, h: 3 }, weight: 10, costSell: 194700, useTu: 25, requiresResearch: 'psi-amp', alienArtefact: true }),
  base({ id: 'mind-probe', name: 'Mind Probe', category: 'equipment', battleType: 'mindprobe', size: { w: 2, h: 2 }, weight: 5, costSell: 304000, useTu: 25, requiresResearch: 'mind-probe', alienArtefact: true, recoveryScore: 30 }),
  // Lasers
  weapon({ id: 'laser-pistol', name: 'Laser Pistol', size: { w: 1, h: 2 }, weight: 7, costSell: 20000, snap: m(20, 40), aimed: m(55, 68), auto: m(25, 28, 3), damage: 46, damageType: 'laser', clipSize: 0, requiresResearch: 'laser-pistol' }),
  weapon({ id: 'laser-rifle', name: 'Laser Rifle', size: { w: 1, h: 3 }, weight: 8, twoHanded: true, costSell: 36900, snap: m(25, 65), aimed: m(50, 100), auto: m(34, 46, 3), damage: 60, damageType: 'laser', clipSize: 0, requiresResearch: 'laser-rifle' }),
  weapon({ id: 'heavy-laser', name: 'Heavy Laser', size: { w: 2, h: 3 }, weight: 18, twoHanded: true, costSell: 61000, snap: m(33, 50), aimed: m(75, 84), damage: 85, damageType: 'laser', clipSize: 0, requiresResearch: 'heavy-laser' }),
  // Plasma
  weapon({ id: 'plasma-pistol', name: 'Plasma Pistol', size: { w: 1, h: 2 }, weight: 3, costSell: 84000, snap: m(30, 65), aimed: m(60, 85), auto: m(30, 50, 3), ammo: ['plasma-pistol-clip'], requiresResearch: 'plasma-pistol', recoveryScore: 20 }),
  ammo({ id: 'plasma-pistol-clip', name: 'Plasma Pistol Clip', damage: 52, damageType: 'plasma', clipSize: 26, weight: 3, costSell: 4000, requiresResearch: 'plasma-pistol-clip', alienArtefact: true, recoveryScore: 5 }),
  weapon({ id: 'plasma-rifle', name: 'Plasma Rifle', size: { w: 1, h: 3 }, weight: 5, twoHanded: true, costSell: 126500, snap: m(30, 86), aimed: m(60, 100), auto: m(36, 55, 3), ammo: ['plasma-rifle-clip'], requiresResearch: 'plasma-rifle', recoveryScore: 20 }),
  ammo({ id: 'plasma-rifle-clip', name: 'Plasma Rifle Clip', damage: 80, damageType: 'plasma', clipSize: 28, weight: 3, costSell: 6290, requiresResearch: 'plasma-rifle-clip', alienArtefact: true, recoveryScore: 5 }),
  weapon({ id: 'heavy-plasma', name: 'Heavy Plasma', size: { w: 2, h: 3 }, weight: 8, twoHanded: true, costSell: 171600, snap: m(30, 75), aimed: m(60, 110), auto: m(35, 50, 3), ammo: ['heavy-plasma-clip'], requiresResearch: 'heavy-plasma', recoveryScore: 20 }),
  ammo({ id: 'heavy-plasma-clip', name: 'Heavy Plasma Clip', damage: 115, damageType: 'plasma', clipSize: 35, weight: 3, costSell: 9590, requiresResearch: 'heavy-plasma-clip', alienArtefact: true, recoveryScore: 5 }),
  weapon({ id: 'small-launcher', name: 'Small Launcher', size: { w: 2, h: 2 }, weight: 10, twoHanded: true, costSell: 120000, snap: m(40, 75), aimed: m(75, 95), ammo: ['stun-bomb'], arcing: true, requiresResearch: 'small-launcher', recoveryScore: 20 }),
  ammo({ id: 'stun-bomb', name: 'Stun Bomb', damage: 90, damageType: 'stun', clipSize: 1, size: { w: 2, h: 1 }, weight: 3, costSell: 15000, blastRadius: 3, requiresResearch: 'stun-bomb', alienArtefact: true, recoveryScore: 5 }),
  weapon({ id: 'blaster-launcher', name: 'Blaster Launcher', size: { w: 2, h: 3 }, weight: 12, twoHanded: true, costSell: 144000, aimed: m(80, 120), ammo: ['blaster-bomb'], guided: true, requiresResearch: 'blaster-launcher', recoveryScore: 20 }),
  ammo({ id: 'blaster-bomb', name: 'Blaster Bomb', damage: 200, damageType: 'he', clipSize: 1, size: { w: 2, h: 1 }, weight: 3, costSell: 8000, blastRadius: 8, requiresResearch: 'blaster-bomb', alienArtefact: true, recoveryScore: 5 }),
  grenade({ id: 'alien-grenade', name: 'Alien Grenade', damage: 90, blastRadius: 4, costSell: 13900, requiresResearch: 'alien-grenade', alienArtefact: true, recoveryScore: 5 }),
  // Armour
  base({ id: 'personal-armour', name: 'Personal Armour', category: 'armour', size: { w: 2, h: 3 }, weight: 12, costSell: 54000, storeSize: 0.8, requiresResearch: 'personal-armour', armour: armourDef(50, 40, 40, 40, 30, 'xcom-personal') }),
  base({ id: 'power-suit', name: 'Power Suit', category: 'armour', size: { w: 2, h: 3 }, weight: 12, costSell: 85000, storeSize: 0.8, requiresResearch: 'power-suit', armour: armourDef(100, 80, 80, 70, 60, 'xcom-power') }),
  base({ id: 'flying-suit', name: 'Flying Suit', category: 'armour', size: { w: 2, h: 3 }, weight: 12, costSell: 90000, storeSize: 0.8, requiresResearch: 'flying-suit', armour: armourDef(110, 90, 90, 80, 70, 'xcom-flying', true) }),
  // Recovered alien technology (alien-core visual family)
  artefact({ id: 'alien-alloys', name: 'Alien Alloys', category: 'alloys', weight: 3, costSell: 6500, storeSize: 0.1, recoveryScore: 1 }),
  artefact({ id: 'elerium-115', name: 'Elerium-115', category: 'elerium', weight: 3, costSell: 5000, storeSize: 0.1, recoveryScore: 5 }),
  artefact({ id: 'ufo-power-source', name: 'UFO Power Source', weight: 40, costSell: 250000, storeSize: 3, recoveryScore: 20 }),
  artefact({ id: 'ufo-navigation', name: 'UFO Navigation', weight: 30, costSell: 80000, storeSize: 2, recoveryScore: 20 }),
  artefact({ id: 'alien-food', name: 'Alien Food', weight: 10, costSell: 5000, storeSize: 1, recoveryScore: 2 }),
  artefact({ id: 'alien-entertainment', name: 'Alien Entertainment', weight: 10, costSell: 20000, storeSize: 1, recoveryScore: 2 }),
  artefact({ id: 'alien-reproduction', name: 'Alien Reproduction', weight: 10, costSell: 10000, storeSize: 1, recoveryScore: 2 }),
  artefact({ id: 'alien-surgery', name: 'Alien Surgery', weight: 10, costSell: 38000, storeSize: 1, recoveryScore: 2 }),
  artefact({ id: 'examination-room', name: 'Examination Room', weight: 10, costSell: 9000, storeSize: 1, recoveryScore: 2 }),
  artefact({ id: 'alien-habitat', name: 'Alien Habitat', weight: 10, costSell: 2000, storeSize: 1, recoveryScore: 2 }),
  // HWPs
  base({ id: 'tank-cannon', name: 'Tank/Cannon', category: 'hwp', battleType: 'none', costBuy: 420000, costSell: 340000, storeSize: 6, hwp: { stats: hwpStats(70, 90, 20, 60), armour: { front: 90, left: 60, right: 60, rear: 60, under: 60 }, damageMod: { stun: 0, smoke: 0 }, weapon: 'hwp-cannon', ammoItem: 'hwp-cannon-shells', ammoRounds: 30, size: 2, unitSprite: 'tank-cannon' } }),
  weapon({ id: 'hwp-cannon', name: 'HWP Cannon', size: { w: 2, h: 3 }, weight: 0, costSell: 0, snap: m(33, 60), aimed: m(80, 90), ammo: ['hwp-cannon-shells'], twoHanded: true }),
  ammo({ id: 'hwp-cannon-shells', name: 'HWP Cannon Shells', damage: 60, damageType: 'ap', clipSize: 30, weight: 0, costBuy: 250, costSell: 187 }),
  base({ id: 'tank-rocket', name: 'Tank/Rocket Launcher', category: 'hwp', costBuy: 480000, costSell: 360000, storeSize: 6, hwp: { stats: hwpStats(70, 90, 20, 60), armour: { front: 90, left: 60, right: 60, rear: 60, under: 60 }, damageMod: { stun: 0, smoke: 0 }, weapon: 'hwp-rocket-launcher', ammoItem: 'hwp-rockets', ammoRounds: 8, size: 2, unitSprite: 'tank-rocket' } }),
  weapon({ id: 'hwp-rocket-launcher', name: 'HWP Rocket Launcher', size: { w: 2, h: 3 }, weight: 0, costSell: 0, snap: m(45, 55), aimed: m(75, 115), ammo: ['hwp-rockets'], twoHanded: true }),
  ammo({ id: 'hwp-rockets', name: 'HWP Rockets', damage: 85, damageType: 'he', clipSize: 8, weight: 0, costBuy: 3000, costSell: 2250, blastRadius: 4 }),
  base({ id: 'tank-laser', name: 'Tank/Laser Cannon', category: 'hwp', costSell: 600000, storeSize: 6, requiresResearch: 'hwp-laser-cannon', hwp: { stats: hwpStats(70, 90, 20, 60), armour: { front: 90, left: 60, right: 60, rear: 60, under: 60 }, damageMod: { stun: 0, smoke: 0 }, weapon: 'hwp-laser', ammoRounds: 0, size: 2, unitSprite: 'tank-laser' } }),
  weapon({ id: 'hwp-laser', name: 'HWP Laser Cannon', size: { w: 2, h: 3 }, weight: 0, costSell: 0, snap: m(33, 50), aimed: m(75, 84), damage: 110, damageType: 'laser', clipSize: 0, twoHanded: true }),
  base({ id: 'hovertank-plasma', name: 'Hovertank/Plasma', category: 'hwp', costSell: 980000, storeSize: 6, requiresResearch: 'hwp-plasma', hwp: { stats: hwpStats(70, 90, 20, 60), armour: { front: 130, left: 130, right: 130, rear: 130, under: 100 }, damageMod: { stun: 0, smoke: 0 }, weapon: 'hwp-plasma-cannon', ammoRounds: 0, flying: true, size: 2, unitSprite: 'hovertank-plasma' } }),
  weapon({ id: 'hwp-plasma-cannon', name: 'HWP Plasma Cannon', size: { w: 2, h: 3 }, weight: 0, costSell: 0, snap: m(30, 75), aimed: m(60, 110), damage: 110, damageType: 'plasma', clipSize: 0, twoHanded: true }),
  base({ id: 'hovertank-launcher', name: 'Hovertank/Launcher', category: 'hwp', costSell: 1000000, storeSize: 6, requiresResearch: 'hwp-fusion', hwp: { stats: hwpStats(70, 90, 20, 60), armour: { front: 130, left: 130, right: 130, rear: 130, under: 100 }, damageMod: { stun: 0, smoke: 0 }, weapon: 'hwp-fusion-launcher', ammoItem: 'hwp-fusion-bomb', ammoRounds: 3, flying: true, size: 2, unitSprite: 'hovertank-launcher' } }),
  weapon({ id: 'hwp-fusion-launcher', name: 'HWP Fusion Launcher', size: { w: 2, h: 3 }, weight: 0, costSell: 0, aimed: m(80, 120), ammo: ['hwp-fusion-bomb'], guided: true, twoHanded: true }),
  ammo({ id: 'hwp-fusion-bomb', name: 'HWP Fusion Bomb', damage: 140, damageType: 'he', clipSize: 3, weight: 0, costSell: 21000, blastRadius: 6, requiresResearch: 'hwp-fusion', alienArtefact: true }),
  // Craft weapons as stores items
  base({ id: 'stingray-launcher', name: 'Stingray Launcher', category: 'craft-weapon', costBuy: 16000, costSell: 12000, storeSize: 0.8 }),
  base({ id: 'stingray-missiles', name: 'Stingray Missiles', category: 'craft-ammo', costBuy: 3000, costSell: 2250, storeSize: 0.4 }),
  base({ id: 'avalanche-launcher', name: 'Avalanche Launcher', category: 'craft-weapon', costBuy: 17000, costSell: 12750, storeSize: 1 }),
  base({ id: 'avalanche-missiles', name: 'Avalanche Missiles', category: 'craft-ammo', costBuy: 9000, costSell: 6750, storeSize: 1.5 }),
  base({ id: 'cannon', name: 'Cannon', category: 'craft-weapon', costBuy: 30000, costSell: 22500, storeSize: 1.5 }),
  base({ id: 'cannon-rounds', name: 'Cannon Rounds (x50)', category: 'craft-ammo', costBuy: 1240, costSell: 930, storeSize: 0.2 }),
  base({ id: 'laser-cannon', name: 'Laser Cannon', category: 'craft-weapon', costSell: 211000, storeSize: 1.5, requiresResearch: 'laser-cannon' }),
  base({ id: 'plasma-beam', name: 'Plasma Beam', category: 'craft-weapon', costSell: 267300, storeSize: 1.5, requiresResearch: 'plasma-cannon', alienArtefact: true }),
  base({ id: 'fusion-ball-launcher', name: 'Fusion Ball Launcher', category: 'craft-weapon', costSell: 281100, storeSize: 1.5, requiresResearch: 'fusion-missile', alienArtefact: true }),
  base({ id: 'fusion-ball', name: 'Fusion Ball', category: 'craft-ammo', costSell: 53300, storeSize: 1, requiresResearch: 'fusion-missile', alienArtefact: true }),
  // Corpses
  corpse('sectoid', 'Sectoid Corpse', 20000), corpse('floater', 'Floater Corpse', 18000), corpse('snakeman', 'Snakeman Corpse', 18000), corpse('muton', 'Muton Corpse', 20000), corpse('ethereal', 'Ethereal Corpse', 25000),
  corpse('chryssalid', 'Chryssalid Corpse', 20000), corpse('silacoid', 'Silacoid Corpse', 10000), corpse('celatid', 'Celatid Corpse', 12000), corpse('reaper', 'Reaper Corpse', 15000, 60), corpse('cyberdisc', 'Cyberdisc Wreck', 50000, 80), corpse('sectopod', 'Sectopod Wreck', 60000, 90), corpse('zombie', 'Zombie Corpse', 5000),
  corpse('civilian', 'Civilian Corpse', 0),
];
// Live aliens per race and rank
const RANKS: [string, string, number][] = [['soldier', 'Soldier', 10], ['navigator', 'Navigator', 12], ['medic', 'Medic', 14], ['engineer', 'Engineer', 16], ['leader', 'Leader', 18], ['commander', 'Commander', 20]];
for (const [race, rn] of [['sectoid', 'Sectoid'], ['floater', 'Floater'], ['snakeman', 'Snakeman'], ['muton', 'Muton'], ['ethereal', 'Ethereal']] as const) {
  for (const [rank, label, v] of RANKS) { if (race === 'muton' && (rank === 'leader' || rank === 'commander' || rank === 'medic')) continue; if (race === 'ethereal' && (rank === 'navigator' || rank === 'medic' || rank === 'engineer')) continue; if (race === 'snakeman' && rank === 'medic') continue; list.push(live(race, rank, `${rn} ${label}`, v)); }
}
for (const [race, rn, v] of [['chryssalid', 'Chryssalid', 25], ['silacoid', 'Silacoid', 14], ['celatid', 'Celatid', 16], ['reaper', 'Reaper', 20], ['cyberdisc', 'Cyberdisc', 20], ['sectopod', 'Sectopod', 30], ['zombie', 'Zombie', 10]] as const) list.push(live(race, 'terrorist', rn, v));

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map((i) => [i.id, i]));
export const itemDef = (id: string): ItemDef | undefined => ITEMS[id];
export const allItems = () => Object.values(ITEMS);
export const isWeapon = (d: ItemDef) => d.category === 'weapon' || d.battleType === 'firearm' || d.battleType === 'melee';
export const DAMAGE_TYPE_NAMES: Record<DamageType, string> = { none: 'None', ap: 'Armour piercing', incendiary: 'Incendiary', he: 'High explosive', laser: 'Laser beam', plasma: 'Plasma beam', stun: 'Stun', melee: 'Melee', acid: 'Acid', smoke: 'Smoke' };
