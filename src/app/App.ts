import { Application, Container } from 'pixi.js';
import { P } from '../design/palette';
import { bus } from '../core/events';

const MAX_DPR = 2;

class AppShell {
  pixi!: Application;
  root!: Container;      // scene layer
  overlay!: Container;   // modals / toasts above scenes
  w = 0; h = 0; dpr = 1;
  safe = { top: 0, right: 0, bottom: 0, left: 0 };
  uiScale = 1;
  reducedMotion = false;
  testMode = false;

  async boot() {
    this.testMode = new URLSearchParams(location.search).get('test') === '1';
    this.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.reducedMotion = this.testMode || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.pixi = new Application();
    await this.pixi.init({
      resizeTo: window, resolution: this.dpr, autoDensity: true, antialias: true, background: P.shell0,
      preference: 'webgl', powerPreference: 'high-performance', eventMode: 'static', hello: false,
    });
    const canvas = this.pixi.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-label', 'Enemy Unknown game canvas');
    canvas.setAttribute('role', 'application');
    document.body.appendChild(canvas);
    this.root = new Container(); this.root.label = 'scenes';
    this.overlay = new Container(); this.overlay.label = 'overlay';
    this.pixi.stage.addChild(this.root, this.overlay);
    this.pixi.stage.eventMode = 'static';
    // Kill Safari gestures / double-tap zoom / context menus at the DOM level.
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => { const now = Date.now(); if (now - lastTouchEnd < 300) e.preventDefault(); lastTouchEnd = now; }, { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
    this.readSafeArea();
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 50));
    window.visualViewport?.addEventListener('resize', () => this.onResize());
  }

  private readSafeArea() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:env(safe-area-inset-top);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left);pointer-events:none;visibility:hidden';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    this.safe = { top: parseFloat(cs.top) || 0, right: parseFloat(cs.right) || 0, bottom: parseFloat(cs.bottom) || 0, left: parseFloat(cs.left) || 0 };
    probe.remove();
  }

  onResize() {
    this.readSafeArea();
    this.w = window.innerWidth; this.h = window.innerHeight;
    bus.emit('resize', { w: this.w, h: this.h });
  }

  /** Usable rect inside safe-area insets. */
  get inner() { return { x: this.safe.left, y: this.safe.top, w: this.w - this.safe.left - this.safe.right, h: this.h - this.safe.top - this.safe.bottom }; }
}

export const app = new AppShell();
export const boot = () => app.boot();
