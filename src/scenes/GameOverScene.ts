import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, button, Panel, keyValue } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, hasState, setState } from '../core/state';
export function statsPanel(w: number): Panel {
  const s = hasState() ? getState().stats : null; const p = new Panel(w, 232, { title: 'Campaign record' }); if (!s) return p; const iw = w - S.x2 * 2;
  const rows = [keyValue('UFOs shot down', s.ufosShotDown, iw), keyValue('UFOs recovered', s.ufosRecovered, iw), keyValue('Missions won', s.missionsWon, iw), keyValue('Missions lost', s.missionsLost, iw), keyValue('Aliens killed', s.aliensKilled, iw), keyValue('Aliens captured', s.aliensCaptured, iw), keyValue('Operatives lost', s.soldiersLost, iw), keyValue('Terror sites defended', s.terrorSitesWon, iw)];
  let y = 0; for (const r of rows) { r.position.set(0, y); p.content.addChild(r); y += 24; } return p;
}
export class GameOverScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const cx = Math.round(app.w / 2); const go = hasState() ? getState().gameOver : null;
    const t = label('PROJECT TERMINATED', { size: 'display', weight: '600', align: 'center', color: P.critical }); t.position.set(cx, app.safe.top + S.x6); this.root.addChild(t);
    const body = label(go?.text ?? 'The campaign is over.', { size: 'control', align: 'center', wrap: Math.min(640, app.w - S.x4) }); body.position.set(cx, app.safe.top + S.x6 + 48); this.root.addChild(body);
    const p = statsPanel(Math.min(480, app.w - S.x4)); p.position.set(cx - p.w / 2, app.safe.top + S.x6 + 120); this.root.addChild(p);
    const b = button({ label: 'MAIN MENU', w: 240, h: 56, variant: 'primary', onTap: () => { setState(null); scenes.show('menu'); } }); b.position.set(cx - 120, app.safe.top + S.x6 + 120 + 232 + S.x3); this.root.addChild(b);
  }
}
