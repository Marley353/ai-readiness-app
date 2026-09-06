import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, button, Panel, header, HEADER_H } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { DIFFICULTY_NAMES, type Difficulty } from '../data/types';
import { newCampaign } from '../core/campaign';
import { setState } from '../core/state';
import { startMission } from './flow';
import { tutorialSetup } from './tutorial';
import { placeFirstBase } from '../core/campaign';
import { scheduleInitialMissions } from '../geoscape/sim';
const EFFECTS = ['Fewest aliens per craft. Standard funding and scoring.', 'A few more aliens. Standard funding.', 'More aliens, sharper shooting, harder council.', 'Large crews, tougher armour, strict council.', 'Maximum crews and accuracy. The council forgives nothing.'];
export class NewGameScene implements Scene {
  private root!: Container; private difficulty: Difficulty = 1; private tutorial = true; private cards: any[] = []; private tut!: any;
  mount(root: Container) { this.root = root; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const w = app.w; this.root.addChild(header(w, 'New campaign', { onBack: () => scenes.show('menu'), subtitle: 'Select difficulty' }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const cw = Math.min(232, Math.floor((w - app.safe.left - app.safe.right - S.x2 * 2 - S.x1 * 4) / 5));
    this.cards = [];
    DIFFICULTY_NAMES.forEach((name, i) => {
      const p = new Panel(cw, 168, { title: name, border: i === this.difficulty ? P.accent : P.border }); p.position.set(x0 + i * (cw + S.x1), y0);
      const t = label(EFFECTS[i], { size: 'body', color: P.textMuted, wrap: cw - S.x2 * 2 }); p.content.addChild(t);
      const b = button({ label: i === this.difficulty ? 'SELECTED' : 'SELECT', w: cw - S.x2 * 2, variant: i === this.difficulty ? 'primary' : 'default', onTap: () => { this.difficulty = i as Difficulty; this.resize(); } }); b.position.set(0, 168 - S.x2 - S.x6 - S.x3 - S.x1); p.content.addChild(b);
      this.root.addChild(p); this.cards.push(p);
    });
    this.tut = button({ label: `Tutorial mission: ${this.tutorial ? 'ON' : 'OFF'}`, icon: this.tutorial ? 'check' : 'cancel', w: 320, selected: this.tutorial, onTap: () => { this.tutorial = !this.tutorial; this.tut.setLabel(`Tutorial mission: ${this.tutorial ? 'ON' : 'OFF'}`); this.tut.setSelected(this.tutorial); } });
    this.tut.position.set(x0, y0 + 168 + S.x3); this.root.addChild(this.tut);
    const start = button({ label: 'START', w: 200, h: 56, variant: 'primary', onTap: () => this.start() }); start.position.set(x0, y0 + 168 + S.x3 + S.x6 + S.x2); this.root.addChild(start);
    const note = label('Permadeath is permanent. Time only moves when you let it.', { size: 'caption', color: P.textDim }); note.position.set(x0 + 216, y0 + 168 + S.x3 + S.x6 + S.x2 + 20); this.root.addChild(note);
  }
  private start() {
    const s = newCampaign(this.difficulty, (Date.now() % 1_000_000_007) >>> 0); setState(s);
    if (this.tutorial) { placeFirstBase(s, -1, 52, 'Alpha Base'); scheduleInitialMissions(s); void startMission({ tutorial: true, setup: tutorialSetup(s) }); }
    else scenes.show('geoscape');
  }
}
