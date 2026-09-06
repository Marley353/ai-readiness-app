import type { AlienRaceDef, AlienRankDef, AlienRank, UnitStats, ArmourValues } from './types';
// Alien stat blocks from the original (UFOpaedia). Weapon sets by month band [0-2, 3-5, 6-8, 9+].
const st = (tu: number, stamina: number, health: number, bravery: number, reactions: number, firing: number, throwing: number, strength: number, psiStrength: number, psiSkill: number, melee: number): UnitStats => ({ tu, stamina, health, bravery, reactions, firing, throwing, strength, psiStrength, psiSkill, melee });
const ar = (front: number, left: number, right: number, rear: number, under: number): ArmourValues => ({ front, left, right, rear, under });
const SETS_EARLY: string[][] = [['plasma-pistol', 'plasma-pistol-clip', 'plasma-pistol-clip'], ['plasma-rifle', 'plasma-rifle-clip', 'plasma-rifle-clip'], ['heavy-plasma', 'heavy-plasma-clip', 'heavy-plasma-clip', 'alien-grenade'], ['heavy-plasma', 'heavy-plasma-clip', 'heavy-plasma-clip', 'alien-grenade']];
const SETS_LEADER: string[][] = [['plasma-rifle', 'plasma-rifle-clip', 'plasma-rifle-clip', 'alien-grenade'], ['heavy-plasma', 'heavy-plasma-clip', 'heavy-plasma-clip', 'alien-grenade'], ['heavy-plasma', 'heavy-plasma-clip', 'heavy-plasma-clip', 'alien-grenade', 'small-launcher', 'stun-bomb', 'stun-bomb'], ['blaster-launcher', 'blaster-bomb', 'blaster-bomb', 'alien-grenade']];
const NONE: string[][] = [[], [], [], []];
function rank(race: string, r: AlienRank, stats: UnitStats, armour: ArmourValues, value: number, weaponSets: string[][], o: Partial<AlienRankDef> = {}): AlienRankDef {
  return { stats, armour, value, weaponSets, aggression: 1, intelligence: 3, standHeight: 21, kneelHeight: 16, liveItem: `${race}-${r}`, corpseItem: `${race}-corpse`, unitSprite: race, interrogation: `${race}-${r}`, ...o };
}
function humanoid(race: string, name: string, base: UnitStats, armour: ArmourValues, value: number, ranks: AlienRank[], o: Partial<AlienRaceDef> & { psiRank?: Partial<Record<AlienRank, number>>; intelligence?: number; aggression?: number } = {}): AlienRaceDef {
  const rk: Partial<Record<AlienRank, AlienRankDef>> = {};
  ranks.forEach((r, i) => {
    const s = { ...base };
    if (r === 'leader' || r === 'commander') { s.firing += 5; s.reactions += 5; s.tu += 2; }
    if (o.psiRank?.[r] !== undefined) s.psiSkill = o.psiRank[r]!;
    const armourRank = r === 'commander' ? ar(armour.front + 6, armour.left + 4, armour.right + 4, armour.rear + 4, armour.under + 2) : armour;
    rk[r] = rank(race, r, s, armourRank, value + i * 2, r === 'leader' || r === 'commander' ? SETS_LEADER : SETS_EARLY, { aggression: o.aggression ?? 1, intelligence: (o.intelligence ?? 3) + (r === 'commander' ? 3 : r === 'leader' ? 2 : 0) });
  });
  const { psiRank, intelligence, aggression, ...rest } = o;
  return { id: race, name, ranks: rk, terrorUnits: [], damageMod: {}, firstMonth: 0, weightByBand: [1, 1, 1, 1], ...rest };
}
function terror(race: string, name: string, stats: UnitStats, armour: ArmourValues, value: number, o: Partial<AlienRaceDef> & { rankOpts?: Partial<AlienRankDef> } = {}): AlienRaceDef {
  const { rankOpts, ...rest } = o;
  return { id: race, name, ranks: { terrorist: rank(race, 'terrorist', stats, armour, value, NONE, { aggression: 2, intelligence: 2, interrogation: `${race}-terrorist`, ...rankOpts }) }, terrorUnits: [], damageMod: {}, firstMonth: 0, weightByBand: [0, 0, 0, 0], ...rest };
}
const ALL: AlienRank[] = ['soldier', 'navigator', 'medic', 'engineer', 'leader', 'commander'];
export const ALIENS: Record<string, AlienRaceDef> = {
  sectoid: humanoid('sectoid', 'Sectoid', st(54, 90, 30, 80, 63, 52, 58, 30, 40, 0, 40), ar(4, 3, 3, 2, 2), 10, ALL, { terrorUnits: ['cyberdisc', 'cyberdisc'], psionic: true, psiRank: { leader: 50, commander: 60 }, firstMonth: 0, weightByBand: [50, 40, 20, 10], damageMod: {} }),
  floater: humanoid('floater', 'Floater', st(50, 90, 35, 80, 50, 50, 58, 40, 35, 0, 50), ar(8, 6, 6, 4, 12), 12, ALL, { terrorUnits: ['reaper', 'reaper'], flying: true, firstMonth: 0, weightByBand: [50, 40, 20, 10] }),
  snakeman: humanoid('snakeman', 'Snakeman', st(40, 80, 45, 80, 45, 58, 58, 47, 40, 0, 60), ar(26, 22, 22, 18, 18), 14, ['soldier', 'navigator', 'engineer', 'leader', 'commander'], { terrorUnits: ['chryssalid', 'chryssalid'], firstMonth: 2, weightByBand: [0, 20, 30, 30], aggression: 1 }),
  muton: humanoid('muton', 'Muton', st(56, 120, 125, 80, 56, 60, 58, 70, 25, 0, 70), ar(20, 20, 20, 10, 10), 16, ['soldier', 'navigator', 'engineer'], { terrorUnits: ['silacoid', 'celatid'], firstMonth: 4, weightByBand: [0, 0, 20, 30], aggression: 2, damageMod: { he: 0.6 } }),
  ethereal: humanoid('ethereal', 'Ethereal', st(68, 96, 55, 80, 75, 65, 58, 48, 75, 60, 40), ar(34, 34, 34, 34, 34), 18, ['soldier', 'leader', 'commander'], { terrorUnits: ['sectopod', 'sectopod'], psionic: true, psiRank: { soldier: 60, leader: 65, commander: 70 }, firstMonth: 6, weightByBand: [0, 0, 10, 20], intelligence: 5 }),
  chryssalid: terror('chryssalid', 'Chryssalid', st(110, 140, 96, 100, 70, 0, 0, 110, 100, 0, 100), ar(34, 34, 34, 34, 34), 25, { meleeOnly: true, special: 'zombify', damageMod: { stun: 1 }, rankOpts: { standHeight: 21, kneelHeight: 16 } }),
  silacoid: terror('silacoid', 'Silacoid', st(40, 80, 70, 100, 60, 0, 0, 60, 100, 0, 100), ar(28, 28, 28, 28, 28), 14, { meleeOnly: true, special: 'fire-trail', damageMod: { incendiary: 0, stun: 0.5 }, rankOpts: { standHeight: 12, kneelHeight: 12 } }),
  celatid: terror('celatid', 'Celatid', st(60, 90, 60, 100, 70, 100, 0, 30, 100, 0, 0), ar(34, 34, 34, 34, 34), 16, { flying: true, special: 'spit', damageMod: {}, rankOpts: { standHeight: 18, kneelHeight: 18 } }),
  reaper: terror('reaper', 'Reaper', st(62, 100, 148, 100, 40, 0, 0, 90, 100, 0, 100), ar(30, 30, 30, 15, 15), 20, { big: true, meleeOnly: true, damageMod: { incendiary: 1.5 }, rankOpts: { standHeight: 23, kneelHeight: 23 } }),
  cyberdisc: terror('cyberdisc', 'Cyberdisc', st(62, 90, 120, 110, 64, 60, 0, 90, 100, 0, 0), ar(34, 34, 34, 34, 34), 20, { big: true, flying: true, special: 'explode-on-death', damageMod: { stun: 0, smoke: 0, he: 1.5 }, rankOpts: { standHeight: 15, kneelHeight: 15, weaponSets: [['hwp-plasma-cannon'], ['hwp-plasma-cannon'], ['hwp-plasma-cannon'], ['hwp-plasma-cannon']] } }),
  sectopod: terror('sectopod', 'Sectopod', st(62, 90, 96, 110, 64, 60, 0, 90, 100, 0, 0), ar(145, 130, 130, 90, 90), 30, { big: true, damageMod: { stun: 0, smoke: 0, laser: 1.5, ap: 0.6, plasma: 0.6, he: 0.6, incendiary: 0.6 }, rankOpts: { standHeight: 23, kneelHeight: 23, weaponSets: [['hwp-plasma-cannon'], ['hwp-plasma-cannon'], ['hwp-plasma-cannon'], ['hwp-plasma-cannon']] } }),
  zombie: terror('zombie', 'Zombie', st(40, 110, 83, 110, 20, 0, 0, 60, 100, 0, 100), ar(6, 6, 6, 6, 6), 10, { meleeOnly: true, damageMod: { stun: 1 } }),
};
/** Difficulty scaling for aliens in the original: counts rise with difficulty (crew tables); stats rise on Veteran+ via a
 *  flat percentage in this implementation (confidence: [close] — the original's stat scaling is undocumented; OpenXcom
 *  vanilla applies +? via "aimAndArmorMultiplier"). Values: multiplier applied to firing accuracy and armour. */
export const DIFFICULTY_ALIEN_STAT_SCALE = { firing: [1, 1, 1.1, 1.2, 1.3], armour: [1, 1, 1.05, 1.1, 1.15], health: [1, 1, 1, 1.1, 1.2] } as const;
export const alienDef = (id: string) => ALIENS[id];
export const rankLabel = (r: AlienRank | string) => (r === 'terrorist' ? '' : r.charAt(0).toUpperCase() + r.slice(1));
