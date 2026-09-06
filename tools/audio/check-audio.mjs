#!/usr/bin/env node
/**
 * check-audio.mjs — verifies the output of build-audio.mjs with no dependencies.
 *
 * Reads every public/audio/<key>.wav header by hand, prints a table (key, duration, peak, RMS, clipped samples,
 * loop seam, bytes) plus the total size, and exits 1 if anything is off: a key from docs/AUDIO.md with no file,
 * a manifest that does not match, a file that is not 16-bit mono 22050 Hz PCM, a peak away from -3 dBFS, clipped
 * samples, a file that neither fades to silence nor joins seamlessly to itself, an ambience loop that is not
 * exactly 12 s, or a total over the 6 MB budget.
 *
 *   node tools/audio/check-audio.mjs            check public/audio
 *   node tools/audio/check-audio.mjs --dir DIR  check somewhere else
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const WANT = { sampleRate: 22050, channels: 1, peakDbfs: -3, peakTolDb: 0.05, loopSeconds: 12, seamMax: 4, budget: 6 * 1024 * 1024 };
const FULL_SCALE = 32767;

const dB = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

function keysFromDoc() {
  const keys = readFileSync(join(ROOT, 'docs/AUDIO.md'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).join(',')
    .split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s));
  return [...new Set(keys)];
}

/** Minimal RIFF/WAVE reader: walks the chunk list and returns the fmt fields plus the PCM samples. */
function parseWav(bytes) {
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a RIFF/WAVE file');
  const riff = bytes.readUInt32LE(4) + 8;
  if (riff !== bytes.length) throw new Error(`RIFF size ${riff} does not match file size ${bytes.length}`);
  let fmt = null, data = null;
  for (let p = 12; p + 8 <= bytes.length;) {
    const id = bytes.toString('ascii', p, p + 4), size = bytes.readUInt32LE(p + 4), body = p + 8;
    if (body + size > bytes.length) throw new Error(`chunk '${id}' runs past the end of the file`);
    if (id === 'fmt ') {
      if (size < 16) throw new Error(`'fmt ' chunk too small (${size} bytes)`);
      fmt = { tag: bytes.readUInt16LE(body), channels: bytes.readUInt16LE(body + 2), sampleRate: bytes.readUInt32LE(body + 4), byteRate: bytes.readUInt32LE(body + 8), blockAlign: bytes.readUInt16LE(body + 12), bits: bytes.readUInt16LE(body + 14) };
    } else if (id === 'data') data = { offset: body, size };
    p = body + size + (size & 1); // chunks are word-aligned
  }
  if (!fmt) throw new Error("no 'fmt ' chunk");
  if (!data) throw new Error("no 'data' chunk");
  if (fmt.tag !== 1) throw new Error(`format tag ${fmt.tag}, expected 1 (PCM)`);
  if (fmt.bits !== 16) throw new Error(`${fmt.bits}-bit, expected 16`);
  const frame = (fmt.channels * fmt.bits) / 8;
  if (fmt.blockAlign !== frame || fmt.byteRate !== fmt.sampleRate * frame) throw new Error('inconsistent fmt chunk');
  if (data.size % frame) throw new Error('data chunk is not a whole number of frames');
  const n = data.size / 2, samples = new Int16Array(n);
  for (let i = 0; i < n; i++) samples[i] = bytes.readInt16LE(data.offset + i * 2);
  return { ...fmt, samples, frames: n / fmt.channels };
}

function analyse(s) {
  let peak = 0, sq = 0, clipped = 0, stepSq = 0;
  for (let i = 0; i < s.length; i++) {
    const a = Math.abs(s[i]);
    if (a > peak) peak = a;
    if (a >= FULL_SCALE) clipped++;
    sq += s[i] * s[i];
    if (i) { const d = s[i] - s[i - 1]; stepSq += d * d; }
  }
  const stepRms = s.length > 1 ? Math.sqrt(stepSq / (s.length - 1)) : 0;
  // Jump at the loop point (last sample -> first sample) relative to a typical sample-to-sample step: ~1x for a
  // seamless join, far larger for a click.
  const seam = stepRms > 0 ? Math.abs(s[0] - s[s.length - 1]) / stepRms : 0;
  return { peakDb: dB(peak / FULL_SCALE), rmsDb: dB(Math.sqrt(sq / s.length) / FULL_SCALE), clipped, seam, first: s[0], last: s[s.length - 1] };
}

function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const dir = dirIdx >= 0 && args[dirIdx + 1] ? resolve(args[dirIdx + 1]) : join(ROOT, 'public/audio');
  const keys = keysFromDoc();
  const problems = [];

  let manifest = null;
  const mp = join(dir, 'manifest.json');
  if (!existsSync(mp)) problems.push('manifest.json is missing');
  else {
    try { manifest = JSON.parse(readFileSync(mp, 'utf8')); } catch (e) { problems.push(`manifest.json: ${e.message}`); }
    if (manifest !== null && (typeof manifest !== 'object' || Array.isArray(manifest))) { problems.push('manifest.json is not a { key: file } object'); manifest = null; }
  }
  if (manifest) {
    for (const k of keys) if (manifest[k] !== `${k}.wav`) problems.push(`manifest: "${k}" should map to "${k}.wav", got ${JSON.stringify(manifest[k])}`);
    for (const k of Object.keys(manifest)) if (!keys.includes(k)) problems.push(`manifest: "${k}" is not listed in docs/AUDIO.md`);
  }
  const onDisk = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.wav')) : [];
  for (const f of onDisk) if (!keys.includes(f.slice(0, -4))) console.warn(`check-audio: stray file ${f} is not listed in docs/AUDIO.md`);

  console.log(pad('key', 22) + padL('dur s', 7) + padL('peak dBFS', 11) + padL('rms dBFS', 10) + padL('clip', 6) + padL('seam', 7) + padL('bytes', 9));
  let total = 0;
  for (const key of keys) {
    const file = join(dir, `${key}.wav`);
    if (!existsSync(file)) { problems.push(`${key}: file missing`); console.log(pad(key, 22) + '  MISSING'); continue; }
    const bytes = readFileSync(file);
    total += bytes.length;
    let w;
    try { w = parseWav(bytes); } catch (e) { problems.push(`${key}: ${e.message}`); console.log(pad(key, 22) + '  BAD WAV: ' + e.message); continue; }
    if (w.sampleRate !== WANT.sampleRate || w.channels !== WANT.channels) problems.push(`${key}: ${w.sampleRate} Hz x ${w.channels} ch, expected ${WANT.sampleRate} Hz mono`);
    const dur = w.frames / w.sampleRate, isLoop = key.startsWith('ambient-');
    if (w.frames === 0) { problems.push(`${key}: no samples`); console.log(pad(key, 22) + '  EMPTY'); continue; }
    const a = analyse(w.samples);
    const silentEdges = Math.abs(a.first) <= 1 && Math.abs(a.last) <= 1, seamless = a.seam <= WANT.seamMax;
    if (Math.abs(a.peakDb - WANT.peakDbfs) > WANT.peakTolDb) problems.push(`${key}: peak ${a.peakDb.toFixed(2)} dBFS, expected ${WANT.peakDbfs}`);
    if (a.clipped) problems.push(`${key}: ${a.clipped} clipped sample(s)`);
    if (!silentEdges && !seamless) problems.push(`${key}: neither fades to silence (${a.first} / ${a.last}) nor loops seamlessly (seam ${a.seam.toFixed(1)}x)`);
    if (isLoop) {
      if (Math.abs(dur - WANT.loopSeconds) > 1e-9) problems.push(`${key}: loop is ${dur.toFixed(4)} s, expected exactly ${WANT.loopSeconds} s`);
      if (!seamless) problems.push(`${key}: loop seam jump is ${a.seam.toFixed(1)}x a typical step — that is a click`);
    }
    console.log(pad(key, 22) + padL(dur.toFixed(3), 7) + padL(a.peakDb.toFixed(2), 11) + padL(a.rmsDb.toFixed(1), 10) + padL(a.clipped, 6) + padL(silentEdges ? '-' : a.seam.toFixed(1) + 'x', 7) + padL(bytes.length, 9));
  }
  const mb = total / 1024 / 1024;
  console.log(`\ncheck-audio: ${keys.length} keys, total ${total} bytes (${mb.toFixed(2)} MB) of ${(WANT.budget / 1024 / 1024).toFixed(0)} MB budget`);
  if (total > WANT.budget) problems.push(`total ${mb.toFixed(2)} MB exceeds the ${WANT.budget / 1024 / 1024} MB budget`);
  if (problems.length) { console.error(`\ncheck-audio: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`); process.exit(1); }
  console.log('check-audio: OK');
}
main();
