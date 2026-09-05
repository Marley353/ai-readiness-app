import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { label } from '../ui/kit';
import { app } from '../app/App';
import { S } from '../design/spacing';
export class SoldiersScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; const t = label('Soldiers', { size: 'title', weight: '600' }); t.position.set(app.safe.left + S.x2, app.safe.top + S.x2); root.addChild(t); }
  unmount() {}
  update(_dt: number) {}
  resize(_w: number, _h: number) {}
}
