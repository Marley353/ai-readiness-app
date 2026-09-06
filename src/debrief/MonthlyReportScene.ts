import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, header, HEADER_H, icon } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { COUNTRIES } from '../data/countries';
import { fmtMoney } from '../core/clock';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export class MonthlyReportScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const s = getState(); const r = s.reports[s.reports.length - 1]; const w = app.w;
    if (!r) { scenes.show('geoscape'); return; }
    this.root.addChild(header(w, `Council report — ${MONTHS[r.month]} ${r.year}`, { subtitle: r.rating }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const lw = Math.min(560, w - x0 - app.safe.right - S.x2 - 320);
    const ph = app.h - y0 - app.safe.bottom - S.x2 - S.x6 - S.x2;
    const p = new Panel(lw, ph, { title: 'Funding by nation' }); p.position.set(x0, y0); this.root.addChild(p);
    const list = new ListView(lw - S.x2 * 2, ph - S.x6 - S.x2); const rows: Container[] = [];
    for (const c of r.fundingChanges) { const rr = row(lw - S.x2 * 2, 44); const n = label(COUNTRIES[c.country]?.name ?? c.country, { size: 'body' }); n.position.set(S.x1, 12); rr.addChild(n); const delta = c.after - c.before; const col = c.pact ? P.critical : delta > 0 ? P.ok : delta < 0 ? P.warn : P.textMuted; const ic = icon(c.pact ? 'critical' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'minus', 20, col); ic.position.set(lw - S.x2 * 2 - 260, 12); rr.addChild(ic); const v = readout(c.pact ? 'PACT' : fmtMoney(c.after), { size: 'body', weight: '600', align: 'right', color: col }); v.position.set(lw - S.x2 * 2 - S.x1, 12); rr.addChild(v); const d = readout(delta === 0 ? '' : (delta > 0 ? '+' : '') + fmtMoney(delta), { size: 'caption', color: P.textMuted, align: 'right' }); d.position.set(lw - S.x2 * 2 - 130, 14); rr.addChild(d); rows.push(rr); }
    list.setRows(rows); p.content.addChild(list);
    const side = new Panel(288, ph, { title: 'Assessment' }); side.position.set(x0 + lw + S.x2, y0); this.root.addChild(side);
    const lines = [`X-COM score ${r.xcomScore}`, `Alien activity ${r.alienScore}`, `Net ${r.score >= 0 ? '+' : ''}${r.score}`, `Total funding ${fmtMoney(r.totalFunding)}`, `Balance ${fmtMoney(s.funds)}`];
    let y = 0; for (const l of lines) { const t = readout(l, { size: 'body' }); t.position.set(0, y); side.content.addChild(t); y += 24; }
    const verdict = label(r.warning ? 'The Council is not satisfied. Another month like this and funding will be withdrawn.' : r.score >= 500 ? 'The Council commends X-COM. Continue.' : 'Acceptable. The Council expects results.', { size: 'body', color: r.warning ? P.warn : P.textMuted, wrap: 288 - S.x2 * 2 }); verdict.position.set(0, y + S.x2); side.content.addChild(verdict);
    if (r.warning) { const wi = icon('warning', 24, P.warn); wi.position.set(0, y + S.x2 + verdict.height + S.x1); side.content.addChild(wi); }
    const cont = button({ label: 'CONTINUE', w: 200, h: S.x6, variant: 'primary', onTap: () => scenes.show(s.gameOver ? 'gameover' : 'geoscape') }); cont.position.set(w - app.safe.right - S.x2 - 200, app.h - app.safe.bottom - S.x2 - S.x6); this.root.addChild(cont);
  }
}
