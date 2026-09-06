// Howler wrapper. All files are procedurally synthesised by tools/audio/build-audio.mjs (public/audio/*.wav).
import { Howl, Howler } from 'howler';

class Sfx {
  private manifest: Record<string, string> = {};
  private howls = new Map<string, Howl>();
  private warned = new Set<string>();
  private sfxVol = 0.8; private musicVol = 0.5; private muted = false;
  private current: Howl | null = null; private currentKey: string | null = null;
  private ready = false;

  async init() {
    try { const r = await fetch('./audio/manifest.json'); if (r.ok) this.manifest = await r.json(); } catch { this.manifest = {}; }
    this.ready = true;
  }
  private get(key: string): Howl | null {
    if (!this.ready) return null;
    let h = this.howls.get(key);
    if (h) return h;
    const file = this.manifest[key];
    if (!file) { if (!this.warned.has(key)) { this.warned.add(key); console.warn(`sfx: unknown key ${key}`); } return null; }
    h = new Howl({ src: [`./audio/${file}`], preload: true, html5: false });
    this.howls.set(key, h);
    return h;
  }
  play(key: string, o: { volume?: number; rate?: number } = {}) {
    const h = this.get(key); if (!h || this.muted) return;
    const id = h.play(); h.volume((o.volume ?? 1) * this.sfxVol, id); if (o.rate) h.rate(o.rate, id);
  }
  music(key: string | null) {
    if (key === this.currentKey) return;
    if (this.current) { const old = this.current; old.fade(old.volume() as number, 0, 300); setTimeout(() => old.stop(), 320); this.current = null; }
    this.currentKey = key;
    if (!key) return;
    const h = this.get(key); if (!h) return;
    h.loop(true); const id = h.play(); h.volume(0, id); h.fade(0, this.muted ? 0 : this.musicVol, 400, id); this.current = h;
  }
  setVolumes(sfx: number, music: number) { this.sfxVol = Math.max(0, Math.min(1, sfx)); this.musicVol = Math.max(0, Math.min(1, music)); if (this.current && !this.muted) this.current.volume(this.musicVol); }
  mute(m: boolean) { this.muted = m; Howler.mute(m); }
}
export const sfx = new Sfx();
