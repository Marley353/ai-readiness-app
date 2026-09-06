import type { ResearchDef } from './types';
type Cat = ResearchDef['category'];
const r = (id: string, name: string, cost: number, category: Cat, o: Partial<ResearchDef> = {}): ResearchDef => ({ id, name, cost, category, points: Math.max(10, Math.round(cost / 10)), ...o });
const RACES = ['sectoid', 'floater', 'snakeman', 'muton', 'ethereal'] as const;
const RACE_NAMES: Record<string, string> = { sectoid: 'Sectoid', floater: 'Floater', snakeman: 'Snakeman', muton: 'Muton', ethereal: 'Ethereal', chryssalid: 'Chryssalid', silacoid: 'Silacoid', celatid: 'Celatid', reaper: 'Reaper', cyberdisc: 'Cyberdisc', sectopod: 'Sectopod', zombie: 'Zombie' };
const RANKS_BY_RACE: Record<string, string[]> = { sectoid: ['soldier', 'navigator', 'medic', 'engineer', 'leader', 'commander'], floater: ['soldier', 'navigator', 'medic', 'engineer', 'leader', 'commander'], snakeman: ['soldier', 'navigator', 'engineer', 'leader', 'commander'], muton: ['soldier', 'navigator', 'engineer'], ethereal: ['soldier', 'leader', 'commander'] };
const AUTOPSIES = ['sectoid', 'floater', 'snakeman', 'muton', 'ethereal', 'chryssalid', 'silacoid', 'celatid', 'reaper', 'cyberdisc', 'sectopod', 'zombie'];
const LIVE_TOPICS: string[] = []; const LEADER_TOPICS: string[] = []; const COMMANDER_TOPICS: string[] = []; const PSI_TOPICS: string[] = [];
const list: ResearchDef[] = [
  r('laser-weapons', 'Laser Weapons', 50, 'weapons'),
  r('laser-pistol', 'Laser Pistol', 100, 'weapons', { requires: ['laser-weapons'] }),
  r('laser-rifle', 'Laser Rifle', 300, 'weapons', { requires: ['laser-pistol'] }),
  r('heavy-laser', 'Heavy Laser', 460, 'weapons', { requires: ['laser-rifle'] }),
  r('laser-cannon', 'Laser Cannon', 500, 'craft', { requires: ['heavy-laser'] }),
  r('laser-defences', 'Laser Defences', 500, 'facilities', { requires: ['laser-cannon'] }),
  r('medi-kit', 'Medi-Kit', 90, 'equipment'),
  r('motion-scanner', 'Motion Scanner', 180, 'equipment'),
  r('alien-alloys', 'Alien Alloys', 300, 'alien-tech', { requiresItem: 'alien-alloys' }),
  r('elerium-115', 'Elerium-115', 450, 'alien-tech', { requiresItem: 'elerium-115' }),
  r('ufo-power-source', 'UFO Power Source', 450, 'alien-tech', { requiresItem: 'ufo-power-source', requires: ['elerium-115'] }),
  r('ufo-navigation', 'UFO Navigation', 450, 'alien-tech', { requiresItem: 'ufo-navigation' }),
  r('ufo-construction', 'UFO Construction', 450, 'alien-tech', { requires: ['alien-alloys', 'ufo-power-source', 'ufo-navigation'] }),
  r('new-fighter-craft', 'New Fighter Craft', 600, 'craft', { requires: ['ufo-construction'] }),
  r('new-fighter-transporter', 'New Fighter-Transporter', 700, 'craft', { requires: ['new-fighter-craft'] }),
  r('ultimate-craft', 'Ultimate Craft', 900, 'craft', { requires: ['new-fighter-transporter'] }),
  r('personal-armour', 'Personal Armour', 300, 'armour', { requires: ['alien-alloys'] }),
  r('power-suit', 'Power Suit', 205, 'armour', { requires: ['personal-armour', 'ufo-power-source'] }),
  r('flying-suit', 'Flying Suit', 330, 'armour', { requires: ['power-suit', 'ufo-navigation'] }),
  r('plasma-pistol', 'Plasma Pistol', 600, 'weapons', { requiresItem: 'plasma-pistol' }),
  r('plasma-pistol-clip', 'Plasma Pistol Clip', 400, 'weapons', { requiresItem: 'plasma-pistol-clip', requires: ['plasma-pistol'] }),
  r('plasma-rifle', 'Plasma Rifle', 700, 'weapons', { requiresItem: 'plasma-rifle' }),
  r('plasma-rifle-clip', 'Plasma Rifle Clip', 400, 'weapons', { requiresItem: 'plasma-rifle-clip', requires: ['plasma-rifle'] }),
  r('heavy-plasma', 'Heavy Plasma', 800, 'weapons', { requiresItem: 'heavy-plasma' }),
  r('heavy-plasma-clip', 'Heavy Plasma Clip', 400, 'weapons', { requiresItem: 'heavy-plasma-clip', requires: ['heavy-plasma'] }),
  r('plasma-cannon', 'Plasma Cannon', 900, 'craft', { requires: ['heavy-plasma', 'heavy-plasma-clip'] }),
  r('plasma-defences', 'Plasma Defences', 620, 'facilities', { requires: ['plasma-cannon'] }),
  r('small-launcher', 'Small Launcher', 550, 'weapons', { requiresItem: 'small-launcher' }),
  r('stun-bomb', 'Stun Bomb', 400, 'weapons', { requiresItem: 'stun-bomb', requires: ['small-launcher'] }),
  r('blaster-launcher', 'Blaster Launcher', 900, 'weapons', { requiresItem: 'blaster-launcher' }),
  r('blaster-bomb', 'Blaster Bomb', 500, 'weapons', { requiresItem: 'blaster-bomb', requires: ['blaster-launcher'] }),
  r('fusion-missile', 'Fusion Missile', 700, 'craft', { requires: ['blaster-launcher', 'blaster-bomb'] }),
  r('fusion-defences', 'Fusion Ball Defences', 800, 'facilities', { requires: ['fusion-missile'] }),
  r('grav-shield', 'Grav Shield', 930, 'facilities', { requires: ['fusion-defences'] }),
  r('alien-grenade', 'Alien Grenade', 200, 'weapons', { requiresItem: 'alien-grenade' }),
  r('mind-probe', 'Mind Probe', 600, 'equipment', { requiresItem: 'mind-probe' }),
  r('psionic-laboratory', 'Psionic Laboratory', 420, 'facilities', { requiresAny: PSI_TOPICS, hidden: true }),
  r('psi-amp', 'Psi-Amp', 500, 'equipment', { requires: ['psionic-laboratory'] }),
  r('mind-shield', 'Mind Shield', 460, 'facilities', { requires: ['psionic-laboratory'] }),
  r('hyper-wave-decoder', 'Hyper-wave Decoder', 670, 'facilities', { requires: ['ufo-navigation'] }),
  r('alien-food', 'Alien Food', 150, 'alien-research', { requiresItem: 'alien-food' }),
  r('alien-entertainment', 'Alien Entertainment', 250, 'alien-research', { requiresItem: 'alien-entertainment' }),
  r('alien-reproduction', 'Alien Reproduction', 300, 'alien-research', { requiresItem: 'alien-reproduction' }),
  r('alien-surgery', 'Alien Surgery', 450, 'alien-research', { requiresItem: 'alien-surgery' }),
  r('examination-room', 'Examination Room', 400, 'alien-research', { requiresItem: 'examination-room' }),
  r('alien-habitat', 'Alien Habitat', 500, 'alien-research', { requiresItem: 'alien-habitat' }),
  r('alien-origins', 'Alien Origins', 300, 'alien-research', { requiresAny: LIVE_TOPICS, hidden: true }),
  r('the-martian-solution', 'The Martian Solution', 500, 'alien-research', { requires: ['alien-origins'], requiresAny: LEADER_TOPICS, hidden: true }),
  r('cydonia-or-bust', 'Cydonia or Bust', 600, 'alien-research', { requires: ['the-martian-solution'], requiresAny: COMMANDER_TOPICS, hidden: true }),
  r('hwp-laser-cannon', 'Tank/Laser Cannon', 350, 'hwp', { requires: ['laser-cannon'] }),
  r('hwp-plasma', 'Hovertank/Plasma', 620, 'hwp', { requires: ['plasma-cannon', 'flying-suit'] }),
  r('hwp-fusion', 'Hovertank/Launcher', 700, 'hwp', { requires: ['fusion-missile', 'flying-suit'] }),
];
for (const race of AUTOPSIES) list.push(r(race, `${RACE_NAMES[race]} Autopsy`, race === 'sectopod' ? 200 : race === 'silacoid' || race === 'celatid' || race === 'reaper' ? 100 : 150, 'alien-life', { requiresItem: `${race}-corpse` }));
for (const race of RACES) {
  for (const rank of RANKS_BY_RACE[race]) {
    const id = `${race}-${rank}`; LIVE_TOPICS.push(id);
    const free: string[] = [];
    if (rank === 'navigator') free.push('ufo-navigation', 'hyper-wave-decoder', 'alien-origins');
    if (rank === 'engineer') free.push('ufo-power-source', 'ufo-construction', 'alien-alloys');
    if (rank === 'medic') free.push(...AUTOPSIES);
    if (rank === 'leader') { free.push('the-martian-solution', 'alien-origins'); LEADER_TOPICS.push(id); }
    if (rank === 'commander') { free.push('cydonia-or-bust', 'the-martian-solution', 'alien-origins'); LEADER_TOPICS.push(id); COMMANDER_TOPICS.push(id); }
    if (rank === 'soldier') free.push('alien-origins');
    if ((race === 'sectoid' && (rank === 'leader' || rank === 'commander')) || race === 'ethereal') { PSI_TOPICS.push(id); free.push('psionic-laboratory'); }
    list.push(r(id, `${RACE_NAMES[race]} ${rank.charAt(0).toUpperCase() + rank.slice(1)}`, 192, 'alien-life', { requiresItem: id, consumes: true, getOneFree: free, points: 50 }));
  }
}
for (const race of ['chryssalid', 'silacoid', 'celatid', 'reaper', 'cyberdisc', 'sectopod', 'zombie']) { const id = `${race}-terrorist`; list.push(r(id, `${RACE_NAMES[race]} (live)`, 192, 'alien-life', { requiresItem: id, consumes: true, getOneFree: [race], points: 50 })); }
export const RESEARCH: Record<string, ResearchDef> = Object.fromEntries(list.map((x) => [x.id, x]));
export const researchDef = (id: string) => RESEARCH[id];
