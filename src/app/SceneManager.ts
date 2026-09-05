import { Container } from 'pixi.js';
import { app } from './App';
import { bus } from '../core/events';

export interface Scene {
  mount(root: Container, params?: any): void;
  unmount(): void;
  update(dt: number): void;       // dt in seconds
  resize(w: number, h: number): void;
}
type Factory = () => Scene;

class SceneManager {
  private factories = new Map<string, Factory>();
  private stack: { name: string; params: any }[] = [];
  current: Scene | null = null;
  currentName = '';
  private container: Container | null = null;
  private tickerInstalled = false;

  register(name: string, f: Factory) { this.factories.set(name, f); }
  has(name: string) { return this.factories.has(name); }
  names() { return [...this.factories.keys()]; }

  show(name: string, params: any = {}, push = true) {
    const f = this.factories.get(name);
    if (!f) throw new Error(`Unknown scene: ${name}`);
    this.unmountCurrent();
    if (push) this.stack.push({ name, params });
    const c = new Container(); c.label = `scene:${name}`;
    app.root.addChild(c);
    this.container = c;
    this.current = f(); this.currentName = name;
    this.current.mount(c, params);
    this.current.resize(app.w, app.h);
    this.installTicker();
    bus.emit('scene', { name, params });
  }

  /** Replace the current scene without growing the stack. */
  replace(name: string, params: any = {}) { this.stack.pop(); this.show(name, params, true); }

  back(fallback = 'geoscape') {
    this.stack.pop();
    const prev = this.stack.pop();
    if (prev) this.show(prev.name, prev.params, true); else this.show(fallback, {}, true);
  }

  private unmountCurrent() {
    if (this.current) { try { this.current.unmount(); } catch (e) { console.error(e); } }
    if (this.container) { this.container.destroy({ children: true }); this.container = null; }
    this.current = null;
  }

  private installTicker() {
    if (this.tickerInstalled) return;
    this.tickerInstalled = true;
    app.pixi.ticker.add((t) => { const dt = Math.min(0.1, t.deltaMS / 1000); this.current?.update(dt); });
    bus.on('resize', ({ w, h }) => this.current?.resize(w, h));
  }
}
export const scenes = new SceneManager();
