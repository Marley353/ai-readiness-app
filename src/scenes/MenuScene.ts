import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, button, Panel } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { sprite, has } from '../render/atlas';
import { sfx } from '../audio/sfx';
export class MenuScene implements Scene {
  private root!: Container;
  mount(root: Container) { this.root = root; this.build(); sfx.music('ambient-geo'); }
  unmount() {}
  update() {}
  resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const w = app.w, h = app.h; const cx = Math.round(w / 2);
    if (has('craft/avenger')) { const s = sprite('craft/avenger'); s.anchor.set(0.5); s.scale.set(2); s.position.set(cx, Math.round(h * 0.28)); s.alpha = 0.9; this.root.addChild(s); }
    const t = label('ENEMY UNKNOWN', { size: 'display', weight: '600', align: 'center' }); t.position.set(cx, Math.round(h * 0.42)); this.root.addChild(t);
    const sub = label('An unaffiliated homage to the 1994 original', { size: 'body', color: P.textMuted, align: 'center' }); sub.position.set(cx, Math.round(h * 0.42) + 40); this.root.addChild(sub);
    const bw = 280; const buttons = [button({ label: 'NEW GAME', w: bw, h: S.x7 ?? 56, variant: 'primary', onTap: () => scenes.show('newgame') }), button({ label: 'LOAD GAME', w: bw, h: 56, onTap: () => scenes.show('saveload', { mode: 'load' }) }), button({ label: 'OPTIONS', w: bw, h: 56, onTap: () => scenes.show('options', { fromMenu: true }) })];
    let y = Math.round(h * 0.55); for (const b of buttons) { b.position.set(cx - bw / 2, y); this.root.addChild(b); y += 56 + S.x1; }
    const v = label('Version 0.1 · Touch: tap to select, long-press for actions, two-finger tap for the original right-click', { size: 'caption', color: P.textDim, align: 'center' }); v.position.set(cx, h - app.safe.bottom - S.x3); this.root.addChild(v);
  }
}
