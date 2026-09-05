type Handler<T = any> = (payload: T) => void;
export type GeoEvent =
  | 'ufo-detected' | 'ufo-lost' | 'ufo-landed' | 'ufo-crashed' | 'ufo-destroyed' | 'craft-arrived' | 'craft-low-fuel'
  | 'craft-returned' | 'intercept' | 'terror-site' | 'alien-base-found' | 'base-attacked' | 'research-done'
  | 'manufacture-done' | 'transfer-arrived' | 'facility-built' | 'month-end' | 'soldier-healed' | 'site-expired'
  | 'funds-low' | 'craft-refuelled' | 'psi-training-done' | 'ufo-escaped' | 'pact';
export type EventName = GeoEvent | 'resize' | 'scene' | 'pause' | 'resume' | 'battle-start' | 'battle-end' | 'state-changed' | 'toast' | 'game-over';
class Bus {
  private map = new Map<string, Set<Handler>>();
  on<T = any>(name: EventName | string, h: Handler<T>) { let s = this.map.get(name); if (!s) { s = new Set(); this.map.set(name, s); } s.add(h); return () => this.off(name, h); }
  off(name: string, h: Handler) { this.map.get(name)?.delete(h); }
  emit<T = any>(name: EventName | string, payload: T) { const s = this.map.get(name); if (!s) return; for (const h of [...s]) { try { h(payload); } catch (e) { console.error(`handler for ${name} failed`, e); } } }
  clear() { this.map.clear(); }
}
export const bus = new Bus();
