import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, button, Panel, Stepper, header, HEADER_H, modal } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, hasState, setState } from '../core/state';
import { sfx } from '../audio/sfx';
import { bus } from '../core/events';
const defaults = () => { try { return JSON.parse(localStorage.getItem('ufo-options') ?? 'null') ?? { sfx: 8, music: 5, uiScale: 1, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, autoEndTurn: false }; } catch { return { sfx: 8, music: 5, uiScale: 1, reducedMotion: false, autoEndTurn: false }; } };
export const currentOptions = () => (hasState() ? getState().options : defaults());
export function applyOptions(o: ReturnType<typeof currentOptions>) { sfx.setVolumes(o.sfx / 10, o.music / 10); app.uiScale = o.uiScale; app.reducedMotion = o.reducedMotion || app.testMode; try { localStorage.setItem('ufo-options', JSON.stringify(o)); } catch {} if (hasState()) getState().options = { ...o }; }
export class OptionsScene implements Scene {
  private root!: Container; private fromMenu = false;
  mount(root: Container, params: any) { this.root = root; this.fromMenu = !!params?.fromMenu; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private build() {
    const o = { ...currentOptions() }; const w = app.w;
    this.root.addChild(header(w, 'Options', { onBack: () => (this.fromMenu || !hasState() ? scenes.show('menu') : scenes.back('geoscape')) }));
    const p = new Panel(Math.min(520, w - S.x4), 360, { title: 'Audio and display' }); p.position.set(app.safe.left + S.x2, HEADER_H + S.x2); this.root.addChild(p);
    const row = (y: number, text: string, ctl: Container) => { const l = label(text, { size: 'control' }); l.position.set(0, y + 12); p.content.addChild(l); ctl.position.set(240, y); p.content.addChild(ctl); };
    row(0, 'Sound effects', new Stepper(o.sfx, { min: 0, max: 10, onChange: (v) => { o.sfx = v; applyOptions(o); sfx.play('ui-tap'); } }));
    row(56, 'Music and ambience', new Stepper(o.music, { min: 0, max: 10, onChange: (v) => { o.music = v; applyOptions(o); } }));
    const scaleBtn = button({ label: `UI scale ${o.uiScale === 1 ? '100 %' : '125 %'}`, w: 176, onTap: () => { o.uiScale = o.uiScale === 1 ? 1.25 : 1; applyOptions(o); bus.emit('resize', { w: app.w, h: app.h }); } }); row(112, 'Scalable UI (dense screens)', scaleBtn);
    const rm = button({ label: `Reduced motion ${o.reducedMotion ? 'ON' : 'OFF'}`, w: 176, selected: o.reducedMotion, onTap: () => { o.reducedMotion = !o.reducedMotion; applyOptions(o); this.resize(); } }); row(168, 'Motion', rm);
    const ae = button({ label: `Auto end turn ${o.autoEndTurn ? 'ON' : 'OFF'}`, w: 176, selected: o.autoEndTurn, onTap: () => { o.autoEndTurn = !o.autoEndTurn; applyOptions(o); this.resize(); } }); row(224, 'Battlescape', ae);
    let x = app.safe.left + S.x2; const y = HEADER_H + S.x2 + 360 + S.x2;
    const add = (b: any) => { b.position.set(x, y); this.root.addChild(b); x += b.w + S.x1; };
    if (hasState()) { add(button({ label: 'SAVE GAME', icon: 'save', onTap: () => scenes.show('saveload', { mode: 'save' }) })); add(button({ label: 'LOAD GAME', icon: 'load', onTap: () => scenes.show('saveload', { mode: 'load' }) })); add(button({ label: 'RESUME', variant: 'primary', onTap: () => scenes.show(getState().battle ? 'battle' : 'geoscape') })); add(button({ label: 'QUIT TO MENU', variant: 'danger', onTap: () => modal({ title: 'Quit to main menu', body: 'Unsaved progress will be lost.', buttons: [{ label: 'CANCEL' }, { label: 'QUIT', variant: 'danger', onTap: () => { setState(null); scenes.show('menu'); } }] }) })); }
    else add(button({ label: 'LOAD GAME', icon: 'load', onTap: () => scenes.show('saveload', { mode: 'load' }) }));
  }
}
