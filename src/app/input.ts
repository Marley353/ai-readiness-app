import { Container, FederatedPointerEvent } from 'pixi.js';
import { app } from './App';

export interface GestureHandlers {
  tap?(x: number, y: number): void;
  longPress?(x: number, y: number): void;
  twoFingerTap?(x: number, y: number): void;
  pinch?(scale: number, cx: number, cy: number): void;   // scale = ratio since last event
  pan?(dx: number, dy: number, fingers: number): void;
  panEnd?(): void;
  down?(x: number, y: number): void;
}
const LONG_PRESS_MS = 450, TAP_MS = 350, MOVE_TOL = 10;

/** Touch-first gesture recogniser on a Pixi container. Mouse works too (no hover is ever required). */
export function attachGestures(target: Container, h: GestureHandlers) {
  target.eventMode = 'static';
  const pts = new Map<number, { x0: number; y0: number; x: number; y: number; t0: number }>();
  let moved = false, longTimer: any = null, longFired = false, maxFingers = 0, lastDist = 0, lastCx = 0, lastCy = 0, downAt = 0;
  const clearLong = () => { if (longTimer) { clearTimeout(longTimer); longTimer = null; } };
  const centre = () => { let x = 0, y = 0; for (const p of pts.values()) { x += p.x; y += p.y; } const n = pts.size || 1; return { x: x / n, y: y / n }; };
  const dist = () => { const a = [...pts.values()]; if (a.length < 2) return 0; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };

  target.on('pointerdown', (e: FederatedPointerEvent) => {
    if (pts.size === 0) { moved = false; longFired = false; maxFingers = 0; downAt = performance.now(); }
    pts.set(e.pointerId, { x0: e.globalX, y0: e.globalY, x: e.globalX, y: e.globalY, t0: performance.now() });
    maxFingers = Math.max(maxFingers, pts.size);
    h.down?.(e.globalX, e.globalY);
    clearLong();
    if (pts.size === 1) {
      longTimer = setTimeout(() => { if (!moved && pts.size === 1) { longFired = true; h.longPress?.(e.globalX, e.globalY); } }, LONG_PRESS_MS);
    } else { const c = centre(); lastDist = dist(); lastCx = c.x; lastCy = c.y; }
  });
  const onMove = (e: FederatedPointerEvent) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const px = p.x, py = p.y; p.x = e.globalX; p.y = e.globalY;
    if (Math.hypot(p.x - p.x0, p.y - p.y0) > MOVE_TOL) { if (!moved) { moved = true; clearLong(); } }
    if (pts.size === 1) { if (moved) h.pan?.(p.x - px, p.y - py, 1); }
    else if (pts.size >= 2) {
      const c = centre(), d = dist();
      if (moved || Math.abs(d - lastDist) > 4) { if (lastDist > 0 && d > 0) h.pinch?.(d / lastDist, c.x, c.y); h.pan?.(c.x - lastCx, c.y - lastCy, pts.size); }
      lastDist = d; lastCx = c.x; lastCy = c.y;
    }
  };
  target.on('pointermove', onMove);
  target.on('globalpointermove', (e: FederatedPointerEvent) => { if (pts.has(e.pointerId)) onMove(e); });
  const onUp = (e: FederatedPointerEvent) => {
    const p = pts.get(e.pointerId); if (!p) return;
    pts.delete(e.pointerId);
    if (pts.size === 0) {
      clearLong();
      const dur = performance.now() - downAt;
      if (!moved && !longFired) {
        if (maxFingers >= 2 && dur < TAP_MS + 150) h.twoFingerTap?.(p.x, p.y);
        else if (maxFingers === 1 && dur < TAP_MS) h.tap?.(p.x, p.y);
        else if (maxFingers === 1 && !longFired) h.tap?.(p.x, p.y); // slow deliberate tap still counts
      }
      h.panEnd?.();
    } else { const c = centre(); lastDist = dist(); lastCx = c.x; lastCy = c.y; }
  };
  target.on('pointerup', onUp); target.on('pointerupoutside', onUp); target.on('pointercancel', onUp);
  return () => { target.removeAllListeners(); clearLong(); };
}

/** Convert global pointer coords into a container's local space. */
export const toLocal = (c: Container, x: number, y: number) => c.toLocal({ x, y });
export const isTest = () => app.testMode;
