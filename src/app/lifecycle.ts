import { bus } from '../core/events';
import { hasState, getState } from '../core/state';
import { autosave } from '../core/save';

/** Pause on backgrounding and persist state so an interruption never loses progress. */
export function installLifecycle() {
  const suspend = () => {
    if (hasState()) { getState().paused = true; bus.emit('pause', { reason: 'background' }); void autosave('interrupt'); }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') suspend(); else bus.emit('resume', {}); });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('blur', suspend);
}
