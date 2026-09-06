#!/usr/bin/env node
/**
 * build-audio.mjs — procedural sound synthesiser for the UFO: Enemy Unknown homage.
 *
 * Renders public/audio/<key>.wav (16-bit PCM, mono, 22050 Hz, peaks at -3 dBFS) for every key
 * listed in docs/AUDIO.md, plus public/audio/manifest.json — a flat { "<key>": "<key>.wav" } map read by
 * src/audio/sfx.ts.
 *
 * Everything is synthesised from first principles — oscillators, noise, biquad filters, FM,
 * envelopes — driven by a per-sound seeded PRNG, so a rebuild is byte-for-byte identical.
 * No samples, no third-party files, no npm dependencies. Node >= 22.
 *
 *   node tools/audio/build-audio.mjs            build into public/audio (prints a table)
 *   node tools/audio/build-audio.mjs --quiet    build without the table
 *   node tools/audio/build-audio.mjs --out DIR  build somewhere else
 *   node tools/audio/check-audio.mjs            verify the output
 *
 * Register: terse military sci-fi. UI = dry filtered clicks, alerts = two-tone chirps,
 * weapons = noise bursts with a low thump, energy weapons = FM sweeps, ambience = low pads.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const SR = 22050;
const PEAK_DBFS = -3;
const LOOP_SECONDS = 12;
const SIZE_BUDGET = 6 * 1024 * 1024;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ deterministic randomness
let rng = mulberry32(1); // reseeded from the key name before each recipe runs
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
const rand = () => rng() * 2 - 1;          // white-noise sample in [-1, 1)
const rnd = (a, b) => a + rng() * (b - a);  // uniform in [a, b)

// ------------------------------------------------------------------ buffers and small maths
const secs = (s) => Math.round(s * SR);
const buf = (s) => new Float32Array(secs(s));
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const pw = (x, p) => Math.pow(Math.max(0, x), p); // NaN-safe fractional power
const dB = (g) => (g > 0 ? 20 * Math.log10(g) : -Infinity);

function peakOf(b) { let p = 0; for (let i = 0; i < b.length; i++) { const a = Math.abs(b[i]); if (a > p) p = a; } return p; }
function n1(b) { const p = peakOf(b); if (p > 0) for (let i = 0; i < b.length; i++) b[i] /= p; return b; } // peak -> 1.0
function gain(b, g) { for (let i = 0; i < b.length; i++) b[i] *= g; return b; }
function mul(a, b) { for (let i = 0; i < a.length; i++) a[i] *= i < b.length ? b[i] : 0; return a; }
function env(b, fn) { for (let i = 0; i < b.length; i++) b[i] *= fn(i / SR); return b; }
function drive(b, k) { for (let i = 0; i < b.length; i++) b[i] = Math.tanh(b[i] * k); return b; } // soft saturation

// envelope / trajectory factories: each returns (t) => value
const expDecay = (tau, t0 = 0) => (t) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));
const attack = (a) => (t) => (a <= 0 ? 1 : clamp01(t / a));
const ar = (a, r, dur) => (t) => (t < a ? clamp01(t / a) : t > dur - r ? clamp01((dur - t) / r) : 1);
const hann = (dur) => (t) => (t < 0 || t > dur ? 0 : 0.5 - 0.5 * Math.cos((TAU * t) / dur));
const sweepExp = (f0, f1, dur) => (t) => f0 * Math.pow(f1 / f0, clamp01(t / dur));
const sweepLin = (f0, f1, dur) => (t) => f0 + (f1 - f0) * clamp01(t / dur);
const at = (t0, fn) => (t) => (t < t0 ? 0 : fn(t - t0)); // delay an envelope

// ------------------------------------------------------------------ sources
function wave(shape, ph) {
  switch (shape) {
    case 'square': return ph < 0.5 ? 1 : -1;
    case 'pulse': return ph < 0.2 ? 1 : -1;
    case 'saw': return 2 * ph - 1;
    case 'tri': return 1 - 4 * Math.abs(ph - 0.5);
    default: return Math.sin(TAU * ph);
  }
}
/**
 * Oscillator. `freq` is Hz or (t) => Hz. Optional classic FM: a modulator at `fm.ratio` x carrier
 * with phase deviation `fm.index` radians (number or (t) => number).
 */
function tone(dur, freq, { shape = 'sine', phase = 0, fm = null } = {}) {
  const n = secs(dur), out = new Float32Array(n);
  const fF = typeof freq === 'function', iF = fm && typeof fm.index === 'function';
  let ph = phase, mph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = fF ? freq(t) : freq;
    let p = ph;
    if (fm) {
      const idx = iF ? fm.index(t) : fm.index;
      p += (idx * Math.sin(TAU * mph)) / TAU;
      mph += (f * fm.ratio) / SR; mph -= Math.floor(mph);
    }
    out[i] = wave(shape, p - Math.floor(p));
    ph += f / SR; ph -= Math.floor(ph);
  }
  return out;
}
function noise(dur) { const n = secs(dur), out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = rand(); return out; }

// ------------------------------------------------------------------ filters
function coeffs(type, f0, Q) {
  f0 = Math.min(Math.max(f0, 20), SR * 0.45);
  const w0 = (TAU * f0) / SR, cw = Math.cos(w0), sw = Math.sin(w0), al = sw / (2 * Q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; } // 0 dB peak gain
  else throw new Error(`unknown filter ${type}`);
  const a0 = 1 + al;
  return [b0 / a0, b1 / a0, b2 / a0, (-2 * cw) / a0, (1 - al) / a0];
}
/** RBJ biquad. `f` and `q` may be (t) => value for sweeps. Returns a new buffer. */
function filter(b, type, f, q = 0.707) {
  const n = b.length, out = new Float32Array(n);
  const fF = typeof f === 'function', qF = typeof q === 'function';
  let c = coeffs(type, fF ? f(0) : f, qF ? q(0) : q);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    if ((fF || qF) && (i & 3) === 0) { const t = i / SR; c = coeffs(type, fF ? f(t) : f, qF ? q(t) : q); }
    const x = b[i];
    const y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}
const lp = (b, f, q) => filter(b, 'lp', f, q);
const hp = (b, f, q) => filter(b, 'hp', f, q);
const bp = (b, f, q) => filter(b, 'bp', f, q);
/** One-pole 6 dB/oct lowpass — brown-ish noise beds, gentle smoothing. */
function onepole(b, f) {
  const a = 1 - Math.exp((-TAU * f) / SR), out = new Float32Array(b.length);
  let y = 0;
  for (let i = 0; i < b.length; i++) { y += a * (b[i] - y); out[i] = y; }
  return out;
}
function dcBlock(b) {
  const R = 1 - (TAU * 10) / SR, out = new Float32Array(b.length);
  let x1 = 0, y1 = 0;
  for (let i = 0; i < b.length; i++) { const y = b[i] - x1 + R * y1; x1 = b[i]; y1 = y; out[i] = y; }
  return out;
}

// ------------------------------------------------------------------ mixing
function mix(dst, src, atSec = 0, g = 1) {
  const o = secs(atSec), n = Math.min(src.length, dst.length - o);
  for (let i = 0; i < n; i++) dst[o + i] += src[i] * g;
  return dst;
}
/** Mix with wrap-around — events near the end of a loop spill into its start. */
function mixWrap(dst, src, atSec = 0, g = 1) {
  const N = dst.length, o = ((secs(atSec) % N) + N) % N;
  for (let i = 0; i < src.length; i++) dst[(o + i) % N] += src[i] * g;
  return dst;
}
/** Sum layers into a fresh buffer: layer(dur, [src, atSec, gain], ...). */
function layer(dur, ...parts) {
  const out = buf(dur);
  for (const p of parts) { const [src, atSec = 0, g = 1] = Array.isArray(p) ? p : [p]; mix(out, src, atSec, g); }
  return out;
}

// ------------------------------------------------------------------ building blocks
/** Poisson-distributed micro-bursts of filtered noise — debris, embers, sparks. */
function crackle(dur, rate, { minLp = 800, maxLp = 6000, minLen = 0.001, maxLen = 0.004, minGain = 0.3, maxGain = 1 } = {}) {
  const out = buf(dur), n = out.length;
  for (let t = -Math.log(1 - rng()) / rate; t < dur; t += -Math.log(1 - rng()) / rate) {
    const len = secs(rnd(minLen, maxLen)), g = rnd(minGain, maxGain), o = secs(t);
    const a = 1 - Math.exp((-TAU * rnd(minLp, maxLp)) / SR);
    let y = 0;
    for (let i = 0; i < len && o + i < n; i++) { y += a * (rand() - y); out[o + i] += y * g * Math.exp(-i / (len * 0.5)); }
  }
  return out;
}
/** Inharmonic decaying partials — metal. partials: [[Hz, tau, gain], ...] */
function metal(dur, partials) {
  const out = buf(dur);
  for (const [f, tau, g = 1] of partials) mix(out, env(tone(dur, f), expDecay(tau)), 0, g);
  return out;
}
/** Band-passed noise click (UI). */
function click({ dur = 0.03, f = 2500, q = 3, tau = 0.003, tick = 0, tickGain = 0.5 } = {}) {
  const c = env(bp(noise(dur), f, q), expDecay(tau));
  if (tick) mix(c, env(tone(dur, tick), expDecay(tau * 1.5)), 0, tickGain);
  return c;
}
/** Sine beep with a touch of 2nd harmonic and linear attack/release. */
function beep(f, dur, { a = 0.004, r = 0.02, harm = 0.15, shape = 'sine' } = {}) {
  const b = tone(dur, f, { shape });
  if (harm) mix(b, tone(dur, f * 2), 0, harm);
  return env(b, ar(a, r, dur));
}
/** Two-tone chirp — the alert vocabulary. */
function twoTone(f1, f2, d1, d2, gap = 0.02, opts) {
  return layer(d1 + gap + d2, [beep(f1, d1, opts), 0], [beep(f2, d2, opts), d1 + gap]);
}
/** Struck bell: fundamental + 2nd + slightly stretched 3rd, exponential decay. */
function bell(f, dur, tau) {
  const b = tone(dur, f);
  mix(b, tone(dur, f * 2), 0, 0.3);
  mix(b, tone(dur, f * 3.01), 0, 0.1);
  return env(b, (t) => attack(0.003)(t) * Math.exp(-t / tau));
}
/** Musical note: sine plus 2nd/3rd partials, optional triangle brightness. */
function note(f, dur, { a = 0.006, r = 0.08, bright = 0 } = {}) {
  const b = tone(dur, f);
  mix(b, tone(dur, f * 2), 0, 0.22);
  mix(b, tone(dur, f * 3), 0, 0.08);
  if (bright) mix(b, tone(dur, f, { shape: 'tri' }), 0, bright);
  return env(b, ar(a, r, dur));
}
/** Band-passed noise whoosh along a frequency path. */
function whoosh(dur, fPath, q = 3, ampFn = hann(dur)) { return env(bp(noise(dur), fPath, q), ampFn); }
/** Firearm: shaped noise burst + pitched low thump + bright crack transient, soft-saturated. */
function gunshot({ dur, tau, lpf, hpf = 0, thump = [200, 60], thumpTau, thumpGain = 1, crack = 0.6, driveK = 1.5 }) {
  let body = lp(env(noise(dur), expDecay(tau)), lpf, 0.8);
  if (hpf) body = hp(body, hpf, 0.7);
  const th = env(tone(dur, sweepExp(thump[0], thump[1], thumpTau * 1.5)), expDecay(thumpTau));
  const cr = env(hp(noise(dur), 3000, 0.7), expDecay(0.004));
  return drive(layer(dur, [n1(body), 0, 1], [n1(th), 0, thumpGain], [n1(cr), 0, crack]), driveK);
}
/** Explosion: noise with a falling lowpass + sub-sine rumble + crack, optional roll and debris. */
function explosion({ dur, tau, lpStart, lpEnd, rumble = [80, 30], rumTau, rumGain = 1.2, debris = 0, debrisAt = 0.1, roll = 0, driveK = 1.8 }) {
  const body = lp(env(noise(dur), expDecay(tau)), sweepExp(lpStart, lpEnd, dur * 0.7), 0.9);
  const rum = env(tone(dur, sweepExp(rumble[0], rumble[1], rumTau * 2)), expDecay(rumTau));
  const cr = env(noise(dur), expDecay(0.006));
  const out = layer(dur, [n1(body), 0, 1], [n1(rum), 0, rumGain], [n1(cr), 0, 0.7]);
  if (roll) mix(out, n1(lp(env(noise(dur), at(roll, expDecay(tau * 0.8))), lpEnd * 3, 0.8)), 0, 0.6);
  if (debris) mix(out, n1(env(crackle(dur, debris, { minLp: 400, maxLp: 3500 }), at(debrisAt, expDecay(tau * 2)))), 0, 0.35);
  return drive(out, driveK);
}
/** Seamless loop of N samples from a longer source: equal-power crossfade of the tail over the head. */
function loopify(src, N, overlap) {
  if (src.length < N + overlap) throw new Error(`loopify: source too short (${src.length} < ${N + overlap})`);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = src[i];
  for (let i = 0; i < overlap; i++) {
    const x = (i / overlap) * (Math.PI / 2);
    out[i] = src[i] * Math.sin(x) + src[N + i] * Math.cos(x);
  }
  return out;
}
/** Random on/off segments — electrical dropouts. */
function gateNoise(dur, minSeg, maxSeg, pOn = 0.6) {
  const g = buf(dur);
  for (let i = 0; i < g.length;) {
    const len = secs(rnd(minSeg, maxSeg)), on = rng() < pOn ? 1 : 0;
    for (let k = 0; k < len && i < g.length; k++, i++) g[i] = on;
  }
  return g;
}

// ------------------------------------------------------------------ loop helpers
const LOOP_N = secs(LOOP_SECONDS);
const LOOP_OV = secs(1.5);
const LOOP_EXT = (LOOP_N + LOOP_OV) / SR;
const pk = (k) => k / LOOP_SECONDS; // k whole cycles per loop -> periodic, seamless by construction

// ------------------------------------------------------------------ recipes
// Each returns a Float32Array, or { samples, loop?, seamless?, fadeIn?, fadeOut? }. `loop` marks a 12 s ambience
// (must be exactly LOOP_N samples); `seamless` marks a shorter bed built to repeat without edge fades.
const SOUNDS = {
  // ---- UI / Geoscape -------------------------------------------------------
  'ui-tap': () => ({ samples: click({ dur: 0.03, f: 2600, q: 3, tau: 0.0028, tick: 1900 }), fadeIn: 0.0003 }),
  'ui-back': () => ({ samples: click({ dur: 0.035, f: 1200, q: 2.5, tau: 0.004, tick: 900 }), fadeIn: 0.0003 }),
  'ui-alert': () => twoTone(880, 1175, 0.06, 0.1, 0.02, { harm: 0.2 }),
  'geo-tick': () => ({ samples: click({ dur: 0.025, f: 3200, q: 4, tau: 0.002, tick: 2400, tickGain: 0.3 }), fadeIn: 0.0003 }),
  'geo-ufo-detected': () => {
    const pair = twoTone(1046, 1318, 0.07, 0.11, 0.015, { harm: 0.25 });
    return layer(0.52, [pair, 0, 1], [pair, 0.26, 1]);
  },
  'geo-intercept': () => twoTone(784, 1046, 0.08, 0.14, 0.015, { harm: 0.2 }),
  'geo-month': () => layer(0.6, [n1(bell(523.25, 0.5, 0.15)), 0, 1], [n1(bell(659.25, 0.45, 0.18)), 0.15, 1]),

  // ---- Weapons -------------------------------------------------------------
  'shot-pistol': () => gunshot({ dur: 0.18, tau: 0.014, lpf: 7000, hpf: 400, thump: [220, 70], thumpTau: 0.03, thumpGain: 0.8, crack: 0.9, driveK: 1.6 }),
  'shot-rifle': () => gunshot({ dur: 0.32, tau: 0.04, lpf: 5500, hpf: 150, thump: [160, 50], thumpTau: 0.05, thumpGain: 1.1, crack: 0.7, driveK: 1.6 }),
  'shot-heavy': () => gunshot({ dur: 0.65, tau: 0.1, lpf: 3500, hpf: 60, thump: [110, 32], thumpTau: 0.14, thumpGain: 1.6, crack: 0.5, driveK: 2 }),
  'shot-auto': () => {
    const out = buf(0.5);
    for (let i = 0; i < 3; i++) {
      const s = gunshot({ dur: 0.25, tau: 0.03, lpf: 5500 * rnd(0.9, 1.1), hpf: 150, thump: [160 * rnd(0.95, 1.05), 50], thumpTau: 0.045, thumpGain: 1.1, crack: 0.7, driveK: 1.6 });
      mix(out, s, i * 0.085, 1);
    }
    return out;
  },
  'shot-rocket': () => {
    const w = whoosh(0.6, sweepExp(300, 3000, 0.5), 4, (t) => pw(Math.sin(Math.PI * clamp01(t / 0.6)), 0.6) * (t < 0.45 ? 1 : Math.exp(-(t - 0.45) / 0.05)));
    const boom = explosion({ dur: 0.95, tau: 0.16, lpStart: 4500, lpEnd: 250, rumble: [70, 28], rumTau: 0.28, rumGain: 1.4, debris: 30, debrisAt: 0.15 });
    return layer(1.4, [n1(w), 0, 0.8], [n1(boom), 0.42, 1]);
  },
  'shot-laser': () => {
    const dur = 0.35, f = sweepExp(2600, 420, 0.3);
    const b = tone(dur, f, { fm: { ratio: 0.5, index: (t) => 2.5 * Math.exp(-t / 0.08) } });
    mix(b, tone(dur, (t) => f(t) * 2), 0, 0.25);
    return env(b, (t) => attack(0.003)(t) * Math.exp(-t / 0.11));
  },
  'shot-plasma': () => {
    const dur = 0.5, f = sweepExp(240, 1500, 0.13);
    const b = env(tone(dur, f, { fm: { ratio: 2.07, index: (t) => 4 * Math.exp(-t / 0.12) } }), (t) => attack(0.004)(t) * Math.exp(-t / 0.13));
    const hiss = env(hp(noise(dur), 3500, 0.7), at(0.05, expDecay(0.14)));
    return layer(dur, [n1(b), 0, 1], [n1(hiss), 0, 0.55]);
  },
  'shot-blaster': () => {
    const wd = 0.4;
    const f = (t) => 95 * (1 + 0.22 * Math.sin(TAU * 15 * t)) * Math.pow(0.6, t / wd);
    const w = env(tone(wd, f, { fm: { ratio: 0.41, index: (t) => 6 * (1 - t / wd) } }), (t) => attack(0.01)(t) * (1 - pw(t / wd, 2)));
    const boom = explosion({ dur: 0.65, tau: 0.16, lpStart: 2500, lpEnd: 150, rumble: [48, 24], rumTau: 0.3, rumGain: 1.6 });
    return layer(0.95, [n1(w), 0, 1], [n1(boom), 0.32, 1]);
  },
  'shot-stun': () => {
    const dur = 0.42;
    const sq = tone(dur, 220, { shape: 'square' });
    mix(sq, tone(dur, 233.6, { shape: 'square' }), 0, 0.7);
    env(sq, (t) => (0.55 + 0.45 * Math.sign(Math.sin(TAU * 46 * t))) * Math.exp(-t / 0.2));
    const b = lp(hp(sq, 250, 0.7), 3200, 0.9);
    const cr = env(crackle(dur, 120, { minLp: 2000, maxLp: 7000 }), expDecay(0.25));
    return layer(dur, [n1(b), 0, 1], [n1(cr), 0, 0.35]);
  },

  // ---- Impacts, explosions, environment -----------------------------------
  'hit-flesh': () => {
    const dur = 0.16;
    const th = env(tone(dur, sweepExp(130, 55, 0.08)), (t) => attack(0.003)(t) * Math.exp(-t / 0.045));
    const n = env(lp(noise(dur), 650, 0.8), (t) => attack(0.002)(t) * Math.exp(-t / 0.03));
    return layer(dur, [n1(th), 0, 1], [n1(n), 0, 0.7]);
  },
  'hit-armour': () => {
    const dur = 0.38;
    const ring = metal(dur, [[1130, 0.09, 1], [1710, 0.07, 0.7], [2470, 0.06, 0.55], [3320, 0.045, 0.4], [4720, 0.03, 0.3]]);
    const k = env(bp(noise(dur), 2500, 1.5), expDecay(0.006));
    const th = env(tone(dur, sweepExp(180, 80, 0.05)), expDecay(0.03));
    return layer(dur, [n1(ring), 0, 1], [n1(k), 0, 0.9], [n1(th), 0, 0.5]);
  },
  'hit-wall': () => {
    const dur = 0.22;
    const n = env(lp(noise(dur), 1800, 0.9), expDecay(0.028));
    const th = env(tone(dur, sweepExp(120, 60, 0.04)), expDecay(0.035));
    const deb = env(crackle(dur, 90, { minLp: 600, maxLp: 3000 }), at(0.03, expDecay(0.07)));
    return drive(layer(dur, [n1(n), 0, 1], [n1(th), 0, 0.8], [n1(deb), 0, 0.4]), 1.4);
  },
  'explode-small': () => explosion({ dur: 0.4, tau: 0.09, lpStart: 5000, lpEnd: 500, rumble: [80, 30], rumTau: 0.15, rumGain: 1.2, debris: 40, debrisAt: 0.1 }),
  'explode-large': () => explosion({ dur: 1.2, tau: 0.3, lpStart: 3500, lpEnd: 150, rumble: [50, 20], rumTau: 0.5, rumGain: 1.5, debris: 40, debrisAt: 0.25, roll: 0.12, driveK: 2 }),
  'smoke': () => {
    const dur = 0.9;
    const h = env(lp(noise(dur), 2200, 0.6), (t) => clamp01(t / 0.12) * Math.exp(-t / 0.28));
    const low = env(onepole(noise(dur), 300), (t) => clamp01(t / 0.1) * Math.exp(-t / 0.3));
    return { samples: layer(dur, [n1(h), 0, 1], [n1(low), 0, 0.4]) };
  },
  'fire-burn': () => {
    // 1 s bed, built seamless so it can be looped without a click
    const N = secs(1.0), ov = secs(0.25), len = (N + ov) / SR;
    const roar = env(onepole(noise(len), 350), (t) => 0.7 + 0.3 * Math.sin(TAU * 3.1 * t) + 0.15 * Math.sin(TAU * 7.3 * t));
    const cr = crackle(len, 55, { minLp: 1200, maxLp: 7000, minLen: 0.001, maxLen: 0.006 });
    return { samples: loopify(layer(len, [n1(roar), 0, 0.9], [n1(cr), 0, 1]), N, ov), seamless: true };
  },
  'door-open': () => {
    const dur = 0.48;
    const slide = env(bp(noise(dur), sweepLin(500, 1300, 0.35), 2.2), (t) => (t < 0.35 ? pw(Math.sin((Math.PI * t) / 0.35), 0.7) : 0));
    const thud = env(tone(0.12, sweepExp(140, 70, 0.03)), expDecay(0.035));
    const clack = env(bp(noise(0.06), 1800, 2), expDecay(0.008));
    return layer(dur, [n1(slide), 0, 1], [n1(thud), 0.36, 0.8], [n1(clack), 0.36, 0.5]);
  },
  'ufo-door': () => {
    const dur = 0.75;
    const hiss = env(hp(noise(dur), sweepExp(5000, 1500, 0.5), 0.7), (t) => clamp01(t / 0.02) * Math.exp(-t / 0.22));
    const tf = (t) => 640 * Math.pow(0.8, t / 0.5) * (1 + 0.012 * Math.sin(TAU * 6.5 * t));
    const tn = tone(dur, tf);
    mix(tn, tone(dur, (t) => tf(t) * 1.5), 0, 0.35);
    env(tn, (t) => clamp01(t / 0.05) * Math.exp(-t / 0.28));
    const clunk = layer(0.2, [n1(metal(0.2, [[420, 0.05, 1], [760, 0.04, 0.6]])), 0, 1], [n1(env(lp(noise(0.2), 2500, 0.8), expDecay(0.01))), 0, 0.8]);
    return layer(dur, [n1(hiss), 0, 1], [n1(tn), 0, 0.7], [n1(clunk), 0.55, 0.6]);
  },

  // ---- Soldier actions -----------------------------------------------------
  'step-soft': () => {
    const dur = 0.1;
    const n = env(lp(noise(dur), 900, 0.8), (t) => attack(0.003)(t) * Math.exp(-t / 0.016));
    const th = env(tone(dur, sweepExp(110, 60, 0.02)), expDecay(0.014));
    return { samples: layer(dur, [n1(n), 0, 1], [n1(th), 0, 0.6]) };
  },
  'step-hard': () => {
    const dur = 0.1;
    const n = env(bp(noise(dur), 1900, 1.4), expDecay(0.009));
    const th = env(tone(dur, sweepExp(160, 90, 0.015)), expDecay(0.012));
    const k = env(hp(noise(dur), 4000, 0.7), expDecay(0.002));
    return { samples: layer(dur, [n1(n), 0, 1], [n1(th), 0, 0.7], [n1(k), 0, 0.5]) };
  },
  'step-metal': () => {
    const dur = 0.18;
    const k = env(bp(noise(dur), 2400, 1.2), expDecay(0.006));
    const ring = metal(dur, [[1900, 0.05, 1], [2900, 0.04, 0.6], [4300, 0.03, 0.4]]);
    const th = env(tone(dur, sweepExp(150, 80, 0.015)), expDecay(0.012));
    return { samples: layer(dur, [n1(k), 0, 1], [n1(ring), 0, 0.55], [n1(th), 0, 0.5]) };
  },
  'kneel': () => {
    const dur = 0.28;
    const swell = (t0, len) => (t) => (t < t0 ? 0 : pw(Math.sin(Math.PI * clamp01((t - t0) / len)), 1.5));
    const r = env(lp(hp(noise(dur), 400, 0.7), 1600, 0.7), (t) => 0.6 * swell(0, 0.14)(t) + 0.9 * swell(0.1, 0.17)(t));
    const th = env(tone(0.08, sweepExp(90, 50, 0.03)), expDecay(0.03));
    return layer(dur, [n1(r), 0, 1], [n1(th), 0.2, 0.5]);
  },
  'throw': () => {
    const dur = 0.36;
    return whoosh(dur, (t) => 400 * Math.pow(4.5, Math.sin(Math.PI * clamp01(t / dur))), 2.5, (t) => pw(Math.sin((Math.PI * t) / dur), 1.6));
  },
  'prime': () => {
    const c = click({ dur: 0.03, f: 2500, q: 3, tau: 0.003 });
    const b = beep(1500, 0.09, { a: 0.003, r: 0.03, harm: 0.1 });
    return layer(0.2, [n1(c), 0, 1], [n1(b), 0.06, 0.8]);
  },
  'reload': () => {
    const c1 = layer(0.08, [n1(env(bp(noise(0.08), 2600, 1.5), expDecay(0.005))), 0, 1], [n1(metal(0.08, [[2400, 0.02, 1], [3600, 0.015, 0.6]])), 0, 0.7]);
    const c2 = layer(0.14, [n1(env(bp(noise(0.14), 1500, 1.5), expDecay(0.007))), 0, 1], [n1(metal(0.14, [[1500, 0.03, 1], [2200, 0.025, 0.7], [900, 0.04, 0.5]])), 0, 0.8]);
    return layer(0.32, [n1(c1), 0, 0.9], [n1(c2), 0.15, 1]);
  },
  'medikit': () => {
    const b1 = beep(1000, 0.08, { a: 0.008, r: 0.03, harm: 0.05 });
    const b2 = beep(1250, 0.1, { a: 0.008, r: 0.04, harm: 0.05 });
    return lp(layer(0.32, [n1(b1), 0, 1], [n1(b2), 0.13, 1]), 4000, 0.7);
  },
  'scanner': () => {
    const dur = 0.6;
    const ping = env(tone(dur, 1500, { fm: { ratio: 1.01, index: 0.4 } }), (t) => attack(0.003)(t) * Math.exp(-t / 0.12));
    const sw = env(tone(dur, sweepExp(700, 3200, 0.42)), (t) => (t > 0.45 ? 0 : 0.8 * pw(Math.sin((Math.PI * t) / 0.45), 0.8)));
    const echo = env(tone(0.24, 1500), (t) => attack(0.003)(t) * Math.exp(-t / 0.08));
    return layer(dur, [n1(ping), 0, 1], [n1(sw), 0, 0.55], [n1(echo), 0.36, 0.35]);
  },
  'psi-attack': () => {
    const dur = 1.05, out = buf(dur);
    for (const [f, g] of [[220, 1], [223.7, 0.8], [331.2, 0.5], [443.9, 0.35], [110.4, 0.5]])
      mix(out, tone(dur, (t) => f * (1 + 0.006 * Math.sin(TAU * (0.9 + f / 400) * t))), 0, g);
    env(out, (t) => clamp01(t / 0.22) * (t < 0.6 ? 1 : Math.exp(-(t - 0.6) / 0.18)) * (0.7 + 0.3 * Math.sin(TAU * 4.2 * t)));
    const shimmer = env(bp(noise(dur), (t) => 2000 + 800 * Math.sin(TAU * 0.7 * t), 6), (t) => clamp01(t / 0.3) * (t < 0.6 ? 1 : Math.exp(-(t - 0.6) / 0.15)));
    return layer(dur, [n1(out), 0, 1], [n1(shimmer), 0, 0.15]);
  },
  'panic': () => {
    const dur = 0.48, f = sweepExp(380, 950, 0.42);
    const b = tone(dur, f);
    mix(b, tone(dur, f, { shape: 'square' }), 0, 0.15);
    env(b, (t) => (0.55 + 0.45 * Math.sin(TAU * (10 * t + (11 * t * t) / dur))) * ar(0.01, 0.08, dur)(t)); // accelerating tremolo
    return lp(b, 5000, 0.7);
  },
  'die-human': () => {
    // glottal-ish pulse through three descending formant filters — a synthetic groan, not a voice recording
    const dur = 0.75;
    const f0 = (t) => (150 - 70 * clamp01(t / 0.6)) * (1 + 0.03 * Math.sin(TAU * 5.5 * t) + 0.01 * Math.sin(TAU * 23 * t));
    const src = tone(dur, f0, { shape: 'saw' });
    mix(src, tone(dur, f0, { shape: 'pulse' }), 0, 0.5);
    mix(src, hp(noise(dur), 1500, 0.7), 0, 0.12);
    const F = (a, b) => (t) => a + (b - a) * clamp01(t / 0.6);
    const v = layer(dur, [n1(bp(src, F(620, 380), 6)), 0, 1], [n1(bp(src, F(1150, 750), 8)), 0, 0.6], [n1(bp(src, F(2500, 2100), 9)), 0, 0.25]);
    env(v, (t) => clamp01(t / 0.03) * (t < 0.45 ? 1 : Math.exp(-(t - 0.45) / 0.12)) * (0.8 + 0.2 * Math.sin(TAU * 6 * t)));
    return lp(v, 3500, 0.7);
  },
  'die-alien': () => {
    const dur = 0.85;
    const f = (t) => 1900 * Math.pow(0.22, clamp01(t / 0.7)) * (1 + 0.15 * Math.sin(TAU * 21 * t));
    const b = env(tone(dur, f, { fm: { ratio: 1.5, index: (t) => 3 + (5 * t) / dur } }), (t) => attack(0.01)(t) * (t < 0.5 ? 1 : Math.exp(-(t - 0.5) / 0.13)));
    const n = env(bp(noise(dur), (t) => f(t) * 1.2, 3), (t) => clamp01(t / 0.05) * (t < 0.5 ? 1 : Math.exp(-(t - 0.5) / 0.1)));
    return layer(dur, [n1(b), 0, 1], [n1(n), 0, 0.3]);
  },
  'die-mech': () => {
    const dur = 0.72, zd = 0.4;
    const buzz = mul(tone(zd, (t) => 55 + 30 * Math.sin(TAU * 9 * t), { shape: 'square' }), gateNoise(zd, 0.006, 0.03, 0.65));
    const zap = env(tone(zd, sweepExp(4200, 180, 0.35)), expDecay(0.12));
    const crk = crackle(zd, 200, { minLp: 2000, maxLp: 8000 });
    const short = lp(env(layer(zd, [n1(buzz), 0, 1], [n1(zap), 0, 0.5], [n1(crk), 0, 0.6]), (t) => attack(0.005)(t) * (1 - (0.3 * t) / zd)), 6000, 0.7);
    const clunk = layer(0.3,
      [n1(env(tone(0.3, sweepExp(120, 60, 0.04)), expDecay(0.05))), 0, 1],
      [n1(metal(0.3, [[520, 0.06, 1], [810, 0.05, 0.6], [1350, 0.03, 0.4]])), 0, 0.6],
      [n1(env(lp(noise(0.3), 3000, 0.8), expDecay(0.012))), 0, 0.7]);
    return layer(dur, [n1(short), 0, 1], [n1(clunk), 0.42, 1.1]);
  },

  // ---- Mission / strategic -------------------------------------------------
  'mission-start': () => {
    const out = buf(0.95);
    for (const [f, t0, d] of [[523.25, 0, 0.22], [659.25, 0.22, 0.22], [783.99, 0.44, 0.5]]) mix(out, note(f, d, { r: d > 0.3 ? 0.3 : 0.06 }), t0, 1);
    return out;
  },
  'mission-win': () => {
    const dur = 1.5, out = buf(dur);
    [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((f, i) => {
      const t0 = i * 0.11, d = dur - t0 - 0.02;
      mix(out, env(note(f, d, { a: 0.005, r: 0.5, bright: 0.2 }), expDecay(0.9)), t0, 0.8 - 0.05 * i);
    });
    return out;
  },
  'mission-lose': () => {
    const dur = 1.7, out = buf(dur);
    for (const [f, t0, d] of [[329.63, 0, 0.3], [293.66, 0.3, 0.3], [261.63, 0.6, 0.3], [220.0, 0.9, 0.78]]) {
      const r = Math.min(0.12, d * 0.4);
      mix(out, note(f, d, { a: 0.01, r }), t0, 0.8);
      mix(out, env(tone(d, f * 0.5), ar(0.01, r, d)), t0, 0.35);
    }
    mix(out, env(tone(dur, 110), (t) => clamp01(t / 0.3) * (t < 1.0 ? 1 : Math.exp(-(t - 1.0) / 0.35))), 0, 0.3);
    return lp(out, 3000, 0.7);
  },
  'craft-launch': () => {
    const dur = 1.6, tail = (t) => (t > 1.4 ? clamp01((dur - t) / 0.2) : 1);
    const jet = env(bp(noise(dur), sweepExp(180, 1600, 1.3), 1.1), (t) => clamp01(pw(t / 1.1, 1.5)) * tail(t));
    const rumble = env(onepole(noise(dur), 90), (t) => clamp01(t / 0.6) * tail(t));
    const whine = env(tone(dur, sweepExp(700, 3200, 1.3)), (t) => clamp01(pw(t / 1.2, 2)) * tail(t));
    return layer(dur, [n1(jet), 0, 1], [n1(rumble), 0, 0.7], [n1(whine), 0, 0.12]);
  },
  'dogfight-cannon': () => {
    const out = buf(0.36);
    for (let i = 0; i < 5; i++) {
      const tap = layer(0.06, [n1(env(bp(noise(0.06), 1500, 1.2), expDecay(0.008))), 0, 1], [n1(env(tone(0.06, sweepExp(140, 70, 0.02)), expDecay(0.012))), 0, 0.8]);
      mix(out, tap, i * 0.062, 1 - 0.05 * i);
    }
    return drive(out, 1.3);
  },
  'dogfight-missile': () => {
    const dur = 0.75;
    const w = whoosh(dur, (t) => 500 * Math.pow(5, Math.sin(Math.PI * clamp01(t / dur))), 2.5, (t) => pw(Math.sin((Math.PI * t) / dur), 1.4));
    const ign = env(crackle(0.15, 300, { minLp: 1500, maxLp: 6000 }), expDecay(0.06));
    return layer(dur, [n1(w), 0, 1], [n1(ign), 0, 0.5]);
  },
  'dogfight-hit': () => {
    const dur = 0.42;
    const n = env(lp(noise(dur), 4000, 0.9), expDecay(0.06));
    const ring = metal(dur, [[900, 0.12, 1], [1400, 0.09, 0.7], [2200, 0.07, 0.5], [3100, 0.05, 0.3]]);
    const th = env(tone(dur, sweepExp(140, 45, 0.08)), expDecay(0.09));
    return drive(layer(dur, [n1(n), 0, 1], [n1(ring), 0, 0.8], [n1(th), 0, 0.8]), 2.2);
  },

  // ---- Ambience: 12 s seamless loops --------------------------------------
  // Tonal layers use frequencies of k/12 Hz (whole cycles per loop); noise layers are crossfaded
  // tail-over-head; events are mixed with wrap-around. The wrapper's music volume sits them under the SFX.
  'ambient-geo': () => {
    const dur = LOOP_SECONDS, pad = buf(dur);
    for (const [k, g] of [[660, 1], [663, 0.9], [990, 0.35], [1320, 0.2], [1326, 0.15]]) mix(pad, tone(dur, pk(k)), 0, g); // 55 / 55.25 / 82.5 / 110 / 110.5 Hz
    env(pad, (t) => 0.85 + 0.15 * Math.sin(TAU * pk(1) * t));
    const nz = loopify(env(lp(noise(LOOP_EXT), (t) => 300 + 200 * Math.sin(TAU * pk(2) * t), 0.8), (t) => 0.7 + 0.3 * Math.sin(TAU * pk(3) * t + 1)), LOOP_N, LOOP_OV);
    return { samples: layer(dur, [n1(pad), 0, 1], [n1(nz), 0, 0.22]), loop: true };
  },
  'ambient-battle-day': () => {
    const dur = LOOP_SECONDS;
    const gust = (t) => 0.5 + 0.25 * Math.sin(TAU * pk(1) * t) + 0.15 * Math.sin(TAU * pk(3) * t + 1.2) + 0.1 * Math.sin(TAU * pk(7) * t + 2.5);
    const wind = loopify(env(lp(noise(LOOP_EXT), (t) => 350 + 450 * gust(t), 0.9), gust), LOOP_N, LOOP_OV);
    const birds = buf(dur);
    for (let g = 0; g < 7; g++) {
      const t0 = rnd(0, dur), count = 2 + Math.floor(rng() * 3), base = rnd(2600, 3800);
      let off = 0;
      for (let c = 0; c < count; c++) {
        const cd = rnd(0.04, 0.09), f0 = base * rnd(0.9, 1.1), f1 = f0 * rnd(0.8, 1.3);
        mixWrap(birds, env(tone(cd, sweepExp(f0, f1, cd)), (t) => pw(Math.sin((Math.PI * t) / cd), 1.2)), t0 + off, rnd(0.5, 1));
        off += cd + rnd(0.03, 0.12);
      }
    }
    return { samples: layer(dur, [n1(wind), 0, 1], [n1(birds), 0, 0.28]), loop: true };
  },
  'ambient-battle-night': () => {
    const dur = LOOP_SECONDS;
    const gust = (t) => 0.45 + 0.25 * Math.sin(TAU * pk(1) * t + 0.7) + 0.15 * Math.sin(TAU * pk(2) * t + 2) + 0.08 * Math.sin(TAU * pk(5) * t);
    const wind = loopify(env(lp(noise(LOOP_EXT), (t) => 200 + 250 * gust(t), 0.9), gust), LOOP_N, LOOP_OV);
    const crickets = buf(dur);
    for (const c of [{ f: 4200, rate: 34, burst: 0.42, gap: 0.35, start: 0 }, { f: 3850, rate: 29, burst: 0.5, gap: 0.6, start: 0.9 }]) {
      for (let t0 = c.start; t0 < dur; t0 += c.burst + c.gap * rnd(0.8, 1.2))
        mixWrap(crickets, env(tone(c.burst, c.f), (t) => pw(Math.sin((Math.PI * t) / c.burst), 0.5) * pw(0.5 + 0.5 * Math.sin(TAU * c.rate * t), 3)), t0, 0.8);
    }
    return { samples: layer(dur, [n1(wind), 0, 1], [n1(crickets), 0, 0.22]), loop: true };
  },
  'ambient-ufo': () => {
    const dur = LOOP_SECONDS, hum = buf(dur);
    for (const [k, g] of [[576, 1], [1152, 0.5], [1731, 0.35], [2304, 0.2]]) mix(hum, tone(dur, pk(k)), 0, g); // 48 / 96 / 144.25 / 192 Hz
    env(hum, (t) => 0.8 + 0.2 * Math.sin(TAU * pk(4) * t));
    const bed = loopify(env(bp(noise(LOOP_EXT), (t) => 900 + 300 * Math.sin(TAU * pk(2) * t), 2.5), (t) => 0.6 + 0.4 * Math.sin(TAU * pk(3) * t + 2)), LOOP_N, LOOP_OV);
    const tones = buf(dur);
    for (const f of [1320, 1760, 990, 1485]) {
      const d = rnd(1.0, 1.8);
      mixWrap(tones, env(tone(d, (t) => f * (1 + 0.004 * Math.sin(TAU * 5 * t)), { fm: { ratio: 2, index: 0.3 } }), (t) => pw(Math.sin((Math.PI * t) / d), 2)), rnd(0, dur), rnd(0.5, 0.9));
    }
    return { samples: layer(dur, [n1(hum), 0, 1], [n1(bed), 0, 0.25], [n1(tones), 0, 0.3]), loop: true };
  },
};

// ------------------------------------------------------------------ post-processing and WAV
function fades(b, inSec, outSec) {
  const ni = Math.min(secs(inSec), b.length >> 1), no = Math.min(secs(outSec), b.length >> 1);
  for (let i = 0; i < ni; i++) b[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / ni);
  for (let i = 0; i < no; i++) b[b.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / no);
  return b;
}
function removeMean(b) { let m = 0; for (let i = 0; i < b.length; i++) m += b[i]; m /= b.length; for (let i = 0; i < b.length; i++) b[i] -= m; return b; }
function normalise(b, dbfs) { const p = peakOf(b); if (p > 0) gain(b, Math.pow(10, dbfs / 20) / p); return b; }

function render(key) {
  rng = mulberry32(fnv1a(key));
  const r = SOUNDS[key]();
  const spec = r instanceof Float32Array ? { samples: r } : r;
  let s = spec.samples;
  for (let i = 0; i < s.length; i++) if (!Number.isFinite(s[i])) throw new Error(`${key}: non-finite sample at ${i}`);
  const loop = !!spec.loop, seamless = loop || !!spec.seamless;
  if (loop && s.length !== LOOP_N) throw new Error(`${key}: loop must be exactly ${LOOP_N} samples, got ${s.length}`);
  if (seamless) removeMean(s);                                                  // no edge fades: continuity comes from construction
  else { s = dcBlock(s); fades(s, spec.fadeIn ?? 0.0005, spec.fadeOut ?? 0.008); } // DC block first so the tail decays to exactly zero
  normalise(s, PEAK_DBFS);                                                      // last, so the peak is exactly -3 dBFS
  return { samples: s, loop, seamless };
}

/** 16-bit PCM mono WAV. */
function wav(samples) {
  const n = samples.length, out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, samples[i])); out.writeInt16LE(Math.round(v * 32767), 44 + i * 2); }
  return out;
}

function keysFromDoc() {
  const p = join(ROOT, 'docs/AUDIO.md');
  if (!existsSync(p)) return Object.keys(SOUNDS);
  const keys = readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).join(',')
    .split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s));
  return [...new Set(keys)];
}

const pad = (s, n) => String(s).padEnd(n);

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const outIdx = args.indexOf('--out');
  const outDir = outIdx >= 0 && args[outIdx + 1] ? resolve(args[outIdx + 1]) : join(ROOT, 'public/audio');
  mkdirSync(outDir, { recursive: true });

  const keys = keysFromDoc();
  const missing = keys.filter((k) => !SOUNDS[k]);
  if (missing.length) { console.error(`build-audio: docs/AUDIO.md lists keys with no recipe: ${missing.join(', ')}`); process.exit(1); }
  const extra = Object.keys(SOUNDS).filter((k) => !keys.includes(k));
  if (extra.length) console.warn(`build-audio: recipes not listed in docs/AUDIO.md: ${extra.join(', ')}`);

  const manifest = {}; // { "<key>": "<key>.wav" } — the shape src/audio/sfx.ts reads
  const rows = [];
  let total = 0;
  const t0 = performance.now();
  for (const key of keys) {
    const { samples, loop, seamless } = render(key);
    const data = wav(samples);
    writeFileSync(join(outDir, `${key}.wav`), data);
    let peak = 0, sq = 0; // measured from the quantised data, i.e. what the file really holds
    for (let i = 0; i < samples.length; i++) { const v = data.readInt16LE(44 + i * 2); if (Math.abs(v) > peak) peak = Math.abs(v); sq += v * v; }
    manifest[key] = `${key}.wav`;
    total += data.length;
    rows.push([key, (samples.length / SR).toFixed(3), dB(peak / 32767).toFixed(2), dB(Math.sqrt(sq / samples.length) / 32767).toFixed(1), loop ? 'loop' : seamless ? 'seam' : '', data.length]);
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  if (!quiet) {
    console.log(pad('key', 22) + pad('dur s', 8) + pad('peak dB', 9) + pad('rms dB', 8) + pad('loop', 6) + 'bytes');
    for (const r of rows) console.log(pad(r[0], 22) + pad(r[1], 8) + pad(r[2], 9) + pad(r[3], 8) + pad(r[4], 6) + r[5]);
  }
  console.log(`build-audio: ${keys.length} files -> ${outDir}  total ${(total / 1024).toFixed(0)} KiB of ${(SIZE_BUDGET / 1024 / 1024).toFixed(0)} MiB budget  (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
  if (total > SIZE_BUDGET) { console.error('build-audio: output exceeds the size budget'); process.exit(1); }
}

main();
