import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, button } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { setState, hasState, getState } from '../core/state';
import { statsPanel } from './GameOverScene';
export class VictoryScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const cx = Math.round(app.w / 2);
    const t = label('CYDONIA IS SILENT', { size: 'display', weight: '600', align: 'center', color: P.ok }); t.position.set(cx, app.safe.top + S.x6); this.root.addChild(t);
    const text = hasState() ? getState().gameOver?.text : undefined;
    const body = label(text ?? 'The alien brain is destroyed. Without its direction the fleets over Earth fall silent, and the Council orders the project to stand down.', { size: 'control', align: 'center', wrap: Math.min(680, app.w - S.x4) }); body.position.set(cx, app.safe.top + S.x6 + 48); this.root.addChild(body);
    const p = statsPanel(Math.min(480, app.w - S.x4)); p.position.set(cx - p.w / 2, app.safe.top + S.x6 + 136); this.root.addChild(p);
    const b = button({ label: 'MAIN MENU', w: 240, h: 56, variant: 'primary', onTap: () => { setState(null); scenes.show('menu'); } }); b.position.set(cx - 120, app.safe.top + S.x6 + 136 + 232 + S.x3); this.root.addChild(b);
  }
}
