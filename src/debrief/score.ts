// Mission debrief: score lines, recovery, casualties, promotions — then applied to the campaign.
import type { GameState, Soldier } from '../core/state';
import type { BattleState } from '../battle/types';
import { ITEMS } from '../data/items';
import { ALIENS } from '../data/aliens';
import { UFOS } from '../data/ufos';
import { SCORE } from '../data/score';
import { campaignRng, baseById, craftById } from '../core/campaign';
import { applyMissionExperience, promote, killedInAction, woundedDays, RANK_TITLES } from '../soldiers/roster';
import { capacities } from '../base/sim';
import { addScore, returnToBase } from '../geoscape/sim';
import { isOut, unitsOf } from '../battle/engine';
import { RESEARCH } from '../data/research';

export interface DebriefLine { label: string; qty: number; points: number }
export interface Debrief { title: string; outcome: 'victory' | 'defeat' | 'aborted'; lines: DebriefLine[]; total: number; rating: string; recovered: Record<string, number>; casualties: { name: string; rank: string; cause: string }[]; promotions: { name: string; rank: string }[]; captives: Record<string, number>; noContainment: boolean; elerium: number; tutorial: boolean }
const alienValue = (race: string, rank: string) => (ALIENS[race]?.ranks as any)?.[rank]?.value ?? 10;
export function computeDebrief(state: GameState, b: BattleState): Debrief {
  const lines: DebriefLine[] = []; const recovered: Record<string, number> = {}; const captives: Record<string, number> = {};
  const outcome: Debrief['outcome'] = b.ended?.winner === 'xcom' ? 'victory' : b.ended?.winner === 'abort' ? 'aborted' : 'defeat';
  const won = outcome === 'victory';
  const killedByRank: Record<string, number> = {}; let killPts = 0, capPts = 0;
  for (const u of b.units) {
    if (u.originalFaction !== 'alien') continue; const k = `${u.race}/${u.rank}`;
    if (u.status === 'dead') { killedByRank[k] = (killedByRank[k] ?? 0) + 1; killPts += alienValue(u.race!, String(u.rank)); }
    else if (u.status === 'unconscious' && won) { const live = (ALIENS[u.race!]?.ranks as any)?.[String(u.rank)]?.liveItem ?? `${u.race}-${u.rank}`; captives[live] = (captives[live] ?? 0) + 1; capPts += alienValue(u.race!, String(u.rank)) * 2; }
  }
  for (const [k, n] of Object.entries(killedByRank)) { const [race, rank] = k.split('/'); lines.push({ label: `${ALIENS[race]?.name ?? race} ${rank === 'terrorist' ? '' : rank} killed`.trim(), qty: n, points: n * alienValue(race, rank) }); }
  for (const [k, n] of Object.entries(captives)) lines.push({ label: `${ITEMS[k]?.name ?? k} captured`, qty: n, points: n * alienValue(k.split('-')[0], k.split('-').slice(1).join('-')) * 2 });
  const civSaved = unitsOf(b, 'civilian').filter((c) => c.status !== 'dead').length; if (b.setup.missionType === 'terror') { if (civSaved) lines.push({ label: 'Civilians saved', qty: civSaved, points: civSaved * SCORE.civilianSaved }); if (b.tally.civKilledAlien) lines.push({ label: 'Civilians killed by aliens', qty: b.tally.civKilledAlien, points: b.tally.civKilledAlien * SCORE.civilianKilledByAlien }); if (b.tally.civKilledXcom) lines.push({ label: 'Civilians killed by X-COM', qty: b.tally.civKilledXcom, points: b.tally.civKilledXcom * SCORE.civilianKilledByXcom }); }
  const dead = b.units.filter((u) => u.originalFaction === 'xcom' && u.status === 'dead' && !u.hwp); if (dead.length) lines.push({ label: 'X-COM operatives lost', qty: dead.length, points: dead.length * SCORE.soldierLost });
  const hwpLost = b.units.filter((u) => u.originalFaction === 'xcom' && u.status === 'dead' && u.hwp); if (hwpLost.length) lines.push({ label: 'HWPs lost', qty: hwpLost.length, points: hwpLost.length * -10 });
  if (won) {
    // items on the map (ground + carried by X-COM), corpses, artefacts
    const inXcomHands = new Set(b.units.filter((u) => u.originalFaction === 'xcom' && !isOut(u) || (u.originalFaction === 'xcom' && u.status === 'unconscious')).flatMap((u) => u.items));
    for (const it of b.items) { if (it.def === 'corpse' || it.def === 'civilian-corpse') continue; const d = ITEMS[it.def]; if (!d) continue; if (it.tile || inXcomHands.has(it.uid) || it.owner !== undefined) { recovered[it.def] = (recovered[it.def] ?? 0) + 1; if (it.ammo && it.rounds > 0) recovered[it.ammo] = (recovered[it.ammo] ?? 0) + 1; } }
    if (b.setup.ufoType) { const ut = UFOS[b.setup.ufoType]; const intactPs = b.map.tiles.filter((t) => t.object === 'power-source').length; for (const r of ut.recovery) { let qty = r.qty; if (r.id === 'ufo-power-source') qty = Math.min(qty, intactPs); if (r.id === 'ufo-navigation') qty = Math.min(qty, b.map.tiles.filter((t) => t.object === 'nav-console').length); if (qty > 0) recovered[r.id] = (recovered[r.id] ?? 0) + qty; } if (intactPs > 0) recovered['elerium-115'] = (recovered['elerium-115'] ?? 0) + intactPs * 50; lines.push({ label: `${ut.name} recovered`, qty: 1, points: ut.score }); }
    if (b.setup.missionType === 'alien-base') { lines.push({ label: 'Alien base destroyed', qty: 1, points: SCORE.alienBaseDestroyed }); recovered['alien-alloys'] = (recovered['alien-alloys'] ?? 0) + 80; recovered['elerium-115'] = (recovered['elerium-115'] ?? 0) + 100; }
    if (b.setup.missionType === 'terror') lines.push({ label: 'Terror site defended', qty: 1, points: SCORE.terrorSiteWon });
    for (const [id, n] of Object.entries(recovered)) { const d = ITEMS[id]; if (d?.recoveryScore) lines.push({ label: `${d.name} recovered`, qty: n, points: n * d.recoveryScore }); }
  } else if (outcome === 'aborted') lines.push({ label: 'Mission aborted', qty: 1, points: SCORE.missionAborted }); else if (b.setup.missionType === 'terror') lines.push({ label: 'Terror site lost', qty: 1, points: SCORE.terrorSiteLost });
  const total = lines.reduce((a, l) => a + l.points, 0);
  const rating = total >= 500 ? 'EXCELLENT' : total >= 200 ? 'GOOD' : total >= 0 ? 'OK' : total >= -200 ? 'POOR' : 'TERRIBLE';
  const casualties = dead.map((u) => { const s = state.soldiers.find((x) => x.id === u.soldierId); return { name: u.name, rank: s ? RANK_TITLES[s.rank] : 'Rookie', cause: 'Killed in action' }; });
  const noContainment = Object.keys(captives).length > 0 && (() => { const c = b.setup.baseId ? baseById(state, b.setup.baseId) : state.bases[0]; return !c || capacities(state, c).containment.max <= 0; })();
  return { title: missionTitle(b), outcome, lines, total, rating, recovered, casualties, promotions: [], captives, noContainment, elerium: recovered['elerium-115'] ?? 0, tutorial: b.setup.missionType === 'tutorial' };
}
export const missionTitle = (b: BattleState) => ({ crash: 'UFO crash recovery', landed: 'UFO assault', terror: `Terror site${b.setup.siteId ? '' : ''}`, 'alien-base': 'Alien base assault', 'base-defence': 'Base defence', 'cydonia-surface': 'Cydonia — surface', 'cydonia-brain': 'Cydonia — the alien brain', tutorial: 'Training exercise' } as Record<string, string>)[b.setup.missionType] ?? 'Mission';
/** Apply the debrief to the campaign: casualties, experience, promotions, recovered items, captives, scores, craft return. */
export function applyDebrief(state: GameState, d: Debrief): { gameOver: boolean; victory: boolean } {
  const b = state.battle; if (!b) return { gameOver: false, victory: false };
  if (d.tutorial) { state.tutorialDone = true; state.battle = null; state.pendingMission = null; return { gameOver: false, victory: false }; }
  const rng = campaignRng(state); const craft = b.setup.craftUid !== undefined ? craftById(state, b.setup.craftUid) : undefined; const base = (b.setup.baseId !== undefined ? baseById(state, b.setup.baseId) : undefined) ?? (craft ? baseById(state, craft.baseId) : undefined) ?? state.bases[0];
  const site = state.sites.find((s) => s.id === b.setup.siteId);
  for (const u of b.units) {
    if (u.originalFaction !== 'xcom' || u.hwp || u.soldierId === undefined) continue; const s = state.soldiers.find((x) => x.id === u.soldierId); if (!s) continue;
    if (u.status === 'dead') { killedInAction(state, s, d.title, 'Killed in action', state.time); if (craft) craft.soldiers = craft.soldiers.filter((id) => id !== s.id); continue; }
    applyMissionExperience(s, u, rng); s.wounded = woundedDays(s, s.stats.health - Math.max(1, u.health), rng);
  }
  d.promotions = promote(state).map((p) => ({ name: state.soldiers.find((s) => s.id === p.soldierId)?.name ?? '', rank: RANK_TITLES[p.rank] }));
  if (base) {
    for (const [id, n] of Object.entries(d.recovered)) base.items[id] = (base.items[id] ?? 0) + n;
    if (!d.noContainment) for (const [id, n] of Object.entries(d.captives)) { base.aliens[id] = (base.aliens[id] ?? 0) + n; state.stats.aliensCaptured += n; } else for (const [id, n] of Object.entries(d.captives)) { const race = id.split('-')[0]; base.items[`${race}-corpse`] = (base.items[`${race}-corpse`] ?? 0) + n; }
    for (const u of b.units) if (u.originalFaction === 'xcom' && u.hwp && u.status !== 'dead') base.items[u.hwp] = (base.items[u.hwp] ?? 0) + 1;
    if (craft) craft.hwps = craft.hwps.filter((h) => b.units.some((u) => u.hwp === h && u.status !== 'dead'));
  }
  state.stats.aliensKilled += b.tally.alienKilled;
  const lon = site?.lon ?? base?.lon ?? 0, lat = site?.lat ?? base?.lat ?? 0;
  if (d.total >= 0) addScore(state, 'xcom', d.total, lon, lat); else addScore(state, 'alien', -d.total, lon, lat);
  if (d.outcome === 'victory') { state.stats.missionsWon++; if (b.setup.missionType === 'terror') state.stats.terrorSitesWon++; if (b.setup.ufoType) state.stats.ufosRecovered++; } else state.stats.missionsLost++;
  let gameOver = false, victory = false;
  if (site) { if (d.outcome === 'victory' || site.kind === 'crash' || site.kind === 'landed') { state.sites = state.sites.filter((s) => s.id !== site.id); const ufo = state.ufos.find((u) => u.id === site.ufoId); if (ufo && (site.kind !== 'terror' || d.outcome === 'victory')) state.ufos = state.ufos.filter((u) => u.id !== ufo.id); } }
  if (b.setup.missionType === 'base-defence' && base) { const ufoId = (state.pendingMission as any)?.ufoId; state.ufos = state.ufos.filter((u) => u.id !== ufoId); if (d.outcome !== 'victory') { state.bases = state.bases.filter((x) => x.id !== base.id); state.craft = state.craft.filter((c) => c.baseId !== base.id); state.soldiers = state.soldiers.filter((s) => s.baseId !== base.id); if (!state.bases.length) { gameOver = true; state.gameOver = { reason: 'defeat', text: 'The last X-COM base has been destroyed.' }; } } }
  if (b.setup.missionType === 'cydonia-brain' && d.outcome === 'victory') { victory = true; state.gameOver = { reason: 'victory', text: 'The alien brain on Mars is destroyed. The invasion of Earth is over.' }; }
  if (b.setup.missionType === 'cydonia-surface' && d.outcome === 'victory') { state.pendingMission = { kind: 'cydonia-brain', craftId: craft?.id, baseId: base?.id }; }
  if (craft && b.setup.missionType !== 'base-defence' && !b.setup.missionType.startsWith('cydonia')) returnToBase(state, craft.id);
  if (craft && b.setup.missionType === 'cydonia-brain') returnToBase(state, craft.id);
  rng.save(); state.battle = null; if (!state.pendingMission?.kind.startsWith('cydonia-brain')) state.pendingMission = null;
  return { gameOver: gameOver || !!state.gameOver, victory };
}
