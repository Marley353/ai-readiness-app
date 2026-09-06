import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, Gauge, Stepper, header, HEADER_H, modal, toast } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { availableProjects, startManufacture, setEngineers, cancelManufacture, freeEngineers, workshopCapacity, spaceUsed, hoursLeft, unitProfit, materialsText, freeWorkshopSpace } from './sim';
import { MANUFACTURE } from '../data/manufacture';
import { ITEMS } from '../data/items';
import { fmtMoney } from '../core/clock';
export class ManufactureScene implements Scene {
  private root!: Container; private baseId = 0;
  mount(root: Container, params: any) { this.root = root; this.baseId = params?.baseId ?? getState().bases[0]?.id ?? 0; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private base() { return getState().bases.find((b) => b.id === this.baseId) ?? getState().bases[0]; }
  private build() {
    const s = getState(); const b = this.base(); const w = app.w; if (!b) { scenes.show('geoscape'); return; }
    this.root.addChild(header(w, 'Manufacturing', { onBack: () => scenes.back('base'), subtitle: b.name, actions: [button({ label: 'NEW PRODUCTION', icon: 'plus', variant: 'primary', onTap: () => this.pick() })] }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const pw = w - x0 - app.safe.right - S.x2; const ph = app.h - y0 - app.safe.bottom - S.x2;
    const p = new Panel(pw, ph, { title: `Engineers free ${freeEngineers(b)} of ${b.engineers} · workshop space ${spaceUsed(b)}/${workshopCapacity(b)} · funds ${fmtMoney(s.funds)}` }); p.position.set(x0, y0); this.root.addChild(p);
    const list = new ListView(pw - S.x2 * 2, ph - S.x6 - S.x2, { gap: 4 }); const rows: Container[] = [];
    for (const m of b.manufacture) {
      const def = MANUFACTURE[m.project]; const r = row(pw - S.x2 * 2, 72); const n = label(def?.name ?? m.project, { size: 'control', weight: '600' }); n.position.set(S.x1, 8); r.addChild(n);
      const g = new Gauge(240, 16, { color: P.accent }); g.set(m.done * def.hours + Math.max(0, m.hoursIntoUnit), m.qty * def.hours); g.position.set(S.x1, 40); r.addChild(g);
      const paused = (m as any).paused as string | undefined; const d = readout(paused ? paused : `${m.done}/${m.qty} · ${m.engineers} engineers · ${hoursLeft(m) === Infinity ? 'idle' : `${hoursLeft(m)} h`}`, { size: 'caption', color: paused ? P.warn : P.textMuted }); d.position.set(264, 40); r.addChild(d);
      const st = new Stepper(m.engineers, { min: 0, max: m.engineers + Math.min(freeEngineers(b), freeWorkshopSpace(b)), onChange: (v) => { const res = setEngineers(s, b.id, m.project, v); if (!res.ok) toast(res.reason, 'warn'); this.resize(); } }); st.position.set(pw - S.x2 * 2 - 176 - S.x1 - 120, 12); r.addChild(st);
      const c = button({ label: 'STOP', variant: 'ghost', w: 112, onTap: () => { cancelManufacture(s, b.id, m.project); this.resize(); } }); c.position.set(pw - S.x2 * 2 - 120, 12); r.addChild(c);
      rows.push(r);
    }
    if (!rows.length) { const r = row(pw - S.x2 * 2, 48); const t = label('Workshops idle. Start production to arm the squad or to sell for profit.', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); rows.push(r); }
    list.setRows(rows); p.content.addChild(list);
  }
  private pick() {
    const s = getState(); const b = this.base(); const avail = availableProjects(s); const w = Math.min(720, app.w - S.x4);
    const list = new ListView(w - S.x2 * 2, Math.min(400, app.h - 200), { gap: 4, onTap: (i) => { const def = avail[i]; close(); const n = Math.min(10, freeEngineers(b), Math.max(0, freeWorkshopSpace(b) - def.space)); const r = startManufacture(s, b.id, def.id, n, 1); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } });
    const rows = avail.map((d) => { const r = row(w - S.x2 * 2, 64); const n = label(d.name, { size: 'control', weight: '600' }); n.position.set(S.x1, 6); r.addChild(n); const sell = ITEMS[d.produces]?.costSell ?? 0; const c = readout(`${d.hours} engineer-hours · ${fmtMoney(d.cost)} · space ${d.space}${d.requiredItems.length ? ' · ' + materialsText(d.id) : ''}`, { size: 'caption', color: P.textMuted }); c.position.set(S.x1, 32); r.addChild(c); const pr = readout(d.producesCraft ? 'CRAFT' : `sell ${fmtMoney(sell)} · profit ${fmtMoney(unitProfit(d.id))}`, { size: 'caption', align: 'right', color: unitProfit(d.id) > 0 ? P.ok : P.textDim }); pr.position.set(w - S.x2 * 2 - S.x1, 32); r.addChild(pr); return r; });
    if (!rows.length) { const r = row(w - S.x2 * 2, 48); const t = label('Nothing to manufacture yet. Research laser weapons or alien artefacts.', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); rows.push(r); }
    list.setRows(rows);
    const close = modal({ title: 'New production', body: list, w, buttons: [{ label: 'CLOSE', variant: 'ghost' }] });
  }
}
