// Howler wrapper. Keys are listed in docs/AUDIO.md; the files come from tools/audio/build-audio.mjs (npm run
// audio), which also writes public/audio/manifest.json as a flat { "<key>": "<key>.wav" } map.
//
// Every call is safe at any time. Before init() has been called, or with a key that is not in the manifest, a
// call is a no-op that warns once per key, so game code never checks whether audio is ready. While the manifest
// is still loading, one-shots are dropped (same warning) but the latest music() request is kept and started as
// soon as the manifest arrives — main.ts shows the first scene without awaiting init(). Howler handles the
// browser autoplay policy: the AudioContext is unlocked by the first tap/click/key, and music started before
// that begins at that moment.
import { Howl, Howler } from 'howler';

export interface PlayOpts {
  /** 0..1, multiplied by the SFX volume from setVolumes(). */
  volume?: number;
  /** Playback speed, 0.5..4 (Howler's range). */
  rate?: number;
}

const AUDIO_BASE = './audio/';
const MUSIC_FADE_MS = 700;

let manifest: Record<string, string> | null = null;
let initPromise: Promise<void> | null = null;
let pendingMusic: string | null | undefined; // music() asked for while the manifest was loading
const oneShots = new Map<string, Howl>();
const loops = new Map<string, Howl>();
const warned = new Set<string>();
let sfxVolume = 1;
let musicVolume = 1;
let current: { key: string; howl: Howl; id: number } | null = null;

const num = (x: number | undefined, dflt: number) => (typeof x === 'number' && Number.isFinite(x) ? x : dflt);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function warnOnce(key: string, why: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`sfx: ${why} — ignoring "${key}"`);
}

/** The Howl for a key, created on first use; null (with a one-time warning) when it cannot be played. */
function howlFor(key: string, loop: boolean): Howl | null {
  if (!manifest) { warnOnce(key, initPromise ? 'audio manifest still loading' : 'sfx.init() has not been called'); return null; }
  const file = manifest[key];
  if (!file) { warnOnce(key, 'unknown audio key'); return null; }
  const cache = loop ? loops : oneShots;
  let h = cache.get(key);
  if (!h) {
    h = new Howl({
      src: [AUDIO_BASE + file], format: ['wav'], loop, html5: false, preload: true,
      onloaderror: (_id, err) => console.warn(`sfx: failed to load ${file}`, err),
    });
    cache.set(key, h);
  }
  return h;
}

/** True when a sound started now will actually be heard now. */
function canStartNow(): boolean {
  const ctx = Howler.ctx as AudioContext | null; // null until the first Howl is created
  if (!Howler.usingWebAudio || !ctx || ctx.state === 'running') return true;
  // Suspended by the autoplay policy. Inside a user gesture Howler resumes the context and the sound follows a
  // few ms later; outside one it would queue the sound and release every queued one on the first tap — for
  // taps and gunfire that is worse than silence. Browsers without userActivation fall back to Howler's queue.
  return navigator.userActivation?.isActive ?? true;
}

function fadeOut(m: { howl: Howl; id: number }): void {
  const v = m.howl.volume(m.id);
  m.howl.fade(typeof v === 'number' ? v : musicVolume, 0, MUSIC_FADE_MS, m.id);
  m.howl.once('fade', () => { m.howl.stop(m.id); }, m.id);
}

export const sfx = {
  /** Fetches ./audio/manifest.json. Idempotent and never rejects: without a manifest audio is simply disabled. */
  init(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          const res = await fetch(`${AUDIO_BASE}manifest.json`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json: unknown = await res.json();
          if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('manifest is not a { key: file } object');
          const m: Record<string, string> = {};
          for (const [k, v] of Object.entries(json as Record<string, unknown>)) if (typeof v === 'string' && v) m[k] = v;
          manifest = m;
        } catch (e) {
          manifest = {};
          console.warn('sfx: audio manifest unavailable, sound disabled', e);
        }
        Howler.autoSuspend = false; // a game fires sounds constantly; skip the idle suspend and its resume latency
        if (pendingMusic !== undefined) { const k = pendingMusic; pendingMusic = undefined; sfx.music(k); }
      })();
    }
    return initPromise;
  },

  /** Plays a one-shot. */
  play(key: string, o: PlayOpts = {}): void {
    const h = howlFor(key, false);
    if (!h || !canStartNow()) return;
    const id = h.play();
    h.volume(clamp(num(o.volume, 1) * sfxVolume, 0, 1), id);
    if (o.rate !== undefined) h.rate(clamp(num(o.rate, 1), 0.5, 4), id);
  },

  /** Cross-fades the looping ambience to `key`; null fades it out. Asking for the current key again is a no-op. */
  music(key: string | null): void {
    if (!manifest && initPromise) { pendingMusic = key; return; }
    if ((current?.key ?? null) === key) return;
    const prev = current;
    current = null;
    if (prev) fadeOut(prev);
    if (key === null) return;
    const h = howlFor(key, true);
    if (!h) return;
    const id = h.play();
    h.fade(0, musicVolume, MUSIC_FADE_MS, id);
    current = { key, howl: h, id };
  },

  /** Both 0..1. SFX volume applies to sounds started from now on; music volume applies immediately. */
  setVolumes(sfxVol: number, musicVol: number): void {
    sfxVolume = clamp(num(sfxVol, 1), 0, 1);
    musicVolume = clamp(num(musicVol, 1), 0, 1);
    if (current) current.howl.volume(musicVolume, current.id);
  },

  /** Mutes everything (Howler master), keeping volumes and playback state. */
  mute(muted: boolean): void {
    Howler.mute(!!muted);
  },
};
