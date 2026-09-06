import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, header, HEADER_H, icon } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { computeDebrief, applyDebrief, type Debrief } from './score';
import { ITEMS } from '../data/items';
import { sfx } from '../audio/sfx';
export class DebriefScene implements Scene {
  private root!: Container; private d: Debrief | null = null;
  mount(root: Container) { this.root = root; const s = getState(); if (!s.battle) { scenes.show('geoscape'); return; } this.d = computeDebrief(s, s.battle); sfx.play(this.d.outcome === 'victory' ? 'mission-win' : 'mission-lose'); this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const d = this.d!; const w = app.w; const col = d.outcome === 'victory' ? P.ok : d.outcome === 'aborted' ? P.warn : P.critical;
    this.root.addChild(header(w, d.title, { subtitle: d.outcome.toUpperCase() }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const half = Math.floor((w - app.safe.left - app.safe.right - S.x2 * 3) / 2); const ph = app.h - y0 - app.safe.bottom - S.x2 - S.x6 - S.x2;
    const left = new Panel(half, ph, { title: 'Score' }); left.position.set(x0, y0); this.root.addChild(left);
    const list = new ListView(half - S.x2 * 2, ph - S.x6 - S.x2 - 40); const rows: Container[] = [];
    for (const l of d.lines) { const r = row(half - S.x2 * 2, 44); const a = label(l.label, { size: 'body' }); a.position.set(S.x1, 12); r.addChild(a); const q = readout(`×${l.qty}`, { size: 'body', color: P.textMuted, align: 'right' }); q.position.set(half - S.x2 * 2 - 120, 12); r.addChild(q); const pts = readout((l.points >= 0 ? '+' : '') + l.points, { size: 'body', weight: '600', align: 'right', color: l.points >= 0 ? P.ok : P.critical }); pts.position.set(half - S.x2 * 2 - S.x1, 12); r.addChild(pts); rows.push(r); }
    list.setRows(rows); left.content.addChild(list);
    const total = readout(`TOTAL ${d.total >= 0 ? '+' : ''}${d.total}   ${d.rating}`, { size: 'title', weight: '600', color: col }); total.position.set(0, ph - S.x6 - S.x2 - 32); left.content.addChild(total);
    const right = new Panel(half, ph, { title: 'Recovered · casualties · promotions' }); right.position.set(x0 + half + S.x2, y0); this.root.addChild(right);
    const rl = new ListView(half - S.x2 * 2, ph - S.x6 - S.x2); const rr: Container[] = [];
    const mk = (text: string, val: string, colour: number = P.text) => { const r = row(half - S.x2 * 2, 44); const a = label(text, { size: 'body', color: colour }); a.position.set(S.x1, 12); r.addChild(a); const v = readout(val, { size: 'body', weight: '600', align: 'right' }); v.position.set(half - S.x2 * 2 - S.x1, 12); r.addChild(v); rr.push(r); };
    for (const [id, n] of Object.entries(d.recovered)) mk(ITEMS[id]?.name ?? id, String(n));
    for (const [id, n] of Object.entries(d.captives)) mk(`${ITEMS[id]?.name ?? id} (live)`, String(n), d.noContainment ? P.warn : P.accent);
    if (d.noContainment) mk('No alien containment: captives did not survive', '', P.warn);
    for (const c of d.casualties) mk(`${c.rank} ${c.name} — ${c.cause}`, '', P.critical);
    if (!Object.keys(d.recovered).length && !d.casualties.length) mk('Nothing recovered', '');
    rl.setRows(rr); right.content.addChild(rl);
    const cont = button({ label: 'CONTINUE', w: 200, h: S.x6, variant: 'primary', onTap: () => this.continue() }); cont.position.set(w - app.safe.right - S.x2 - 200, app.h - app.safe.bottom - S.x2 - S.x6); this.root.addChild(cont);
    const badge = icon(d.outcome === 'victory' ? 'check' : 'warning', 24, col); badge.position.set(x0, app.h - app.safe.bottom - S.x2 - S.x6 + 12); this.root.addChild(badge);
    const note = label(d.outcome === 'victory' ? 'Mission accomplished' : d.outcome === 'aborted' ? 'Mission aborted' : 'Mission failed', { size: 'control', weight: '600', color: col }); note.position.set(x0 + 32, app.h - app.safe.bottom - S.x2 - S.x6 + 12); this.root.addChild(note);
  }
  private continue() {
    const s = getState(); const d = this.d!; const r = applyDebrief(s, d);
    if (d.promotions.length) { /* shown on the geoscape as toasts */ }
    if (r.victory) { scenes.show('victory'); return; } if (r.gameOver) { scenes.show('gameover'); return; }
    if (s.pendingMission?.kind === 'cydonia-brain') { scenes.show('battle', { pending: true }); return; }
    scenes.show('geoscape');
  }
}
