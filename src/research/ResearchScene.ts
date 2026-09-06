import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, Gauge, Stepper, header, HEADER_H, modal, toast } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { availableResearch, startResearch, setResearchScientists, cancelResearch, freeScientists, labCapacity, allocatedScientists, daysLeft, researchCost, requirementText, researchDef, maxScientists } from './sim';
export class ResearchScene implements Scene {
  private root!: Container; private baseId = 0;
  mount(root: Container, params: any) { this.root = root; this.baseId = params?.baseId ?? getState().bases[0]?.id ?? 0; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private base() { return getState().bases.find((b) => b.id === this.baseId) ?? getState().bases[0]; }
  private build() {
    const s = getState(); const b = this.base(); const w = app.w; if (!b) { scenes.show('geoscape'); return; }
    this.root.addChild(header(w, 'Research', { onBack: () => scenes.back('base'), subtitle: b.name, actions: [button({ label: 'NEW PROJECT', icon: 'plus', variant: 'primary', onTap: () => this.pick() })] }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const pw = w - x0 - app.safe.right - S.x2; const ph = app.h - y0 - app.safe.bottom - S.x2;
    const p = new Panel(pw, ph, { title: `Current projects · scientists free ${freeScientists(b)} of ${b.scientists} · lab space ${allocatedScientists(b)}/${labCapacity(b)}` }); p.position.set(x0, y0); this.root.addChild(p);
    const list = new ListView(pw - S.x2 * 2, ph - S.x6 - S.x2, { gap: 4 }); const rows: Container[] = [];
    for (const pr of b.research) {
      const def = researchDef(pr.topic); const r = row(pw - S.x2 * 2, 72); const n = label(def?.name ?? pr.topic, { size: 'control', weight: '600' }); n.position.set(S.x1, 8); r.addChild(n);
      const g = new Gauge(240, 16, { color: P.accent }); g.set(pr.progress, researchCost(pr.topic)); g.position.set(S.x1, 40); r.addChild(g);
      const d = readout(`${pr.scientists} scientists · ${daysLeft(pr) === Infinity ? 'no progress' : `${daysLeft(pr)} days`}`, { size: 'caption', color: P.textMuted }); d.position.set(264, 40); r.addChild(d);
      const st = new Stepper(pr.scientists, { min: 0, max: maxScientists(b, pr.scientists), onChange: (v) => { const res = setResearchScientists(s, b.id, pr.topic, v); if (!res.ok) toast(res.reason, 'warn'); this.resize(); } }); st.position.set(pw - S.x2 * 2 - 176 - S.x1 - 120, 12); r.addChild(st);
      const c = button({ label: 'CANCEL', variant: 'ghost', w: 112, onTap: () => { cancelResearch(s, b.id, pr.topic); this.resize(); } }); c.position.set(pw - S.x2 * 2 - 120, 12); r.addChild(c);
      rows.push(r);
    }
    if (!rows.length) { const r = row(pw - S.x2 * 2, 48); const t = label('No research in progress. Assign scientists to a new project.', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); rows.push(r); }
    list.setRows(rows); p.content.addChild(list);
  }
  private pick() {
    const s = getState(); const b = this.base(); const avail = availableResearch(s, b.id); const w = Math.min(640, app.w - S.x4);
    const list = new ListView(w - S.x2 * 2, Math.min(400, app.h - 200), { gap: 4, onTap: (i) => { const def = avail[i]; close(); const n = Math.min(10, maxScientists(b)); const r = startResearch(s, b.id, def.id, n); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } });
    const rows = avail.map((d) => { const r = row(w - S.x2 * 2, 56); const n = label(d.name, { size: 'control', weight: '600' }); n.position.set(S.x1, 8); r.addChild(n); const c = readout(`${d.cost} scientist-days`, { size: 'caption', color: P.textMuted }); c.position.set(S.x1, 32); r.addChild(c); const req = label(requirementText(b, d), { size: 'caption', color: P.textDim, align: 'right' }); req.position.set(w - S.x2 * 2 - S.x1, 32); r.addChild(req); return r; });
    if (!rows.length) { const r = row(w - S.x2 * 2, 48); const t = label('Nothing new to research. Recover alien artefacts and captives.', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); rows.push(r); }
    list.setRows(rows);
    const close = modal({ title: 'New research project', body: list, w, buttons: [{ label: 'CLOSE', variant: 'ghost' }] });
  }
}
