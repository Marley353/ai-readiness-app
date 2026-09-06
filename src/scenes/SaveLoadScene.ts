import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, ListView, row, header, HEADER_H, modal, toast } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { listSaves, saveGame, loadGame, deleteSave, SLOTS, type SaveMeta } from '../core/save';
import { getState, hasState } from '../core/state';
import { fmtDate, fmtMoney } from '../core/clock';
import { DIFFICULTY_NAMES } from '../data/types';
export class SaveLoadScene implements Scene {
  private root!: Container; private mode: 'save' | 'load' = 'load'; private saves: SaveMeta[] = []; private list: ListView | null = null;
  mount(root: Container, params: any) { this.root = root; this.mode = params?.mode ?? 'load'; this.build(); void this.refresh(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); void this.refresh(); }
  private async refresh() { this.saves = await listSaves(); this.fill(); }
  private build() {
    const w = app.w; this.root.addChild(header(w, this.mode === 'save' ? 'Save game' : 'Load game', { onBack: () => (hasState() ? scenes.back('geoscape') : scenes.show('menu')) }));
    const lw = Math.min(760, w - app.safe.left - app.safe.right - S.x4); this.list = new ListView(lw, app.h - HEADER_H - S.x4 - app.safe.bottom, { gap: 4 }); this.list.position.set(app.safe.left + S.x2, HEADER_H + S.x2); this.root.addChild(this.list);
    const hint = label('Loading', { size: 'caption', color: P.textMuted }); hint.position.set(app.safe.left + S.x2, HEADER_H + S.x2); this.root.addChild(hint); (this as any).hint = hint;
  }
  private fill() {
    if (!this.list) return; (this as any).hint.visible = false; const lw = this.list.w; const rows: Container[] = [];
    const slots = [...SLOTS, 'auto-mission', 'auto-month', 'auto-interrupt'];
    for (const slot of slots) {
      const m = this.saves.find((s) => s.slot === slot); const auto = slot.startsWith('auto'); if (auto && !m) continue;
      const r = row(lw, 64); const name = label(m ? m.name : `${slot.replace('slot-', 'Slot ')} — empty`, { size: 'control', weight: '600', color: m ? P.text : P.textDim }); name.position.set(S.x2, 8); r.addChild(name);
      if (m) { const meta = readout(`${fmtDate(m.time)}  ${fmtMoney(m.funds)}  ${DIFFICULTY_NAMES[m.difficulty]}  saved ${new Date(m.savedAt).toLocaleString('en-GB')}`, { size: 'caption', color: P.textMuted }); meta.position.set(S.x2, 36); r.addChild(meta); }
      let x = lw - S.x2;
      if (this.mode === 'save' && !auto) { const b = button({ label: m ? 'OVERWRITE' : 'SAVE', variant: 'primary', w: 128, onTap: () => this.doSave(slot) }); x -= b.w; b.position.set(x, 8); r.addChild(b); x -= S.x1; }
      if (m) { const b = button({ label: 'LOAD', w: 96, variant: this.mode === 'load' ? 'primary' : 'default', onTap: () => this.doLoad(slot) }); x -= b.w; b.position.set(x, 8); r.addChild(b); x -= S.x1; const d = button({ icon: 'delete', w: S.x6, variant: 'ghost', onTap: () => modal({ title: 'Delete save', body: `Delete "${m.name}"?`, buttons: [{ label: 'CANCEL' }, { label: 'DELETE', variant: 'danger', onTap: async () => { await deleteSave(slot); void this.refresh(); } }] }) }); x -= d.w; d.position.set(x, 8); r.addChild(d); }
      rows.push(r);
    }
    this.list.setRows(rows);
  }
  private async doSave(slot: string) { if (!hasState()) return; const s = getState(); await saveGame(slot, `${slot.replace('slot-', 'Slot ')} — ${fmtDate(s.time)}`); toast('Game saved'); void this.refresh(); }
  private async doLoad(slot: string) { const s = await loadGame(slot); if (!s) { toast('Save not found', 'warn'); return; } scenes.show(s.battle ? 'battle' : s.bases.length ? 'geoscape' : 'geoscape'); }
}
