import { scenes } from './SceneManager';
import { bus } from '../core/events';
import { getState, hasState, setState } from '../core/state';
import { app } from './App';

/** With ?test=1, expose a driving API for critics and automated play-throughs. Builders add entries via hooks.add(). */
const registry: Record<string, any> = {};
export const hooks = {
  add(name: string, fn: any) { registry[name] = fn; if ((window as any).__ufo) (window as any).__ufo[name] = fn; },
};
export function installTestHooks() {
  const api: any = {
    get state() { return hasState() ? getState() : null; },
    setState,
    scenes, bus, app,
    get scene() { return scenes.currentName; },
    warnings: [] as string[],
    errors: [] as string[],
    ...registry,
  };
  (window as any).__ufo = api;
  const origWarn = console.warn.bind(console), origErr = console.error.bind(console);
  console.warn = (...a: any[]) => { api.warnings.push(a.map(String).join(' ')); origWarn(...a); };
  console.error = (...a: any[]) => { api.errors.push(a.map(String).join(' ')); origErr(...a); };
  window.addEventListener('error', (e) => api.errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => api.errors.push(String((e as any).reason)));
}
