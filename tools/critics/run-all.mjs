// Runs every critic against the preview server and records the iteration in progress.html.
// Usage: UFO_URL=http://127.0.0.1:4173/ node tools/critics/run-all.mjs <iteration> [note] [critic,critic]
import { launch } from './lib.mjs';
import { record } from './progress.mjs';
import { mkdir, copyFile } from 'node:fs/promises';
const iteration = Number(process.argv[2] ?? 0);
const note = process.argv[3] ?? '';
const only = (process.argv[4] ?? '').split(',').filter(Boolean);
const CRITICS = ['functional', 'fidelity', 'touch', 'craft', 'art', 'a11y', 'perf'];
const browser = await launch();
const results = [];
for (const name of CRITICS) {
  if (only.length && !only.includes(name)) continue;
  const t0 = Date.now();
  try {
    const mod = await import(`./critic-${name}.mjs`);
    const r = await mod.run(browser);
    r.name = name; r.seconds = Math.round((Date.now() - t0) / 1000);
    results.push(r);
    console.log(`[${name}] ${r.pass ? 'PASS' : 'FAIL'} — ${r.defects.length} defects (${r.seconds}s)`);
    for (const d of r.defects) console.log('   -', d);
  } catch (e) {
    results.push({ name, pass: false, defects: [`critic crashed: ${e.message}`], screenshots: [] });
    console.log(`[${name}] CRASH ${e.message}`);
  }
}
await browser.close();
// keep this iteration's captures so before/after comparisons survive later runs
const dir = `screenshots/iter-${iteration}`; await mkdir(dir, { recursive: true });
for (const r of results) { const kept = []; for (const p of r.screenshots ?? []) { const dest = `${dir}/${p.split('/').pop()}`; try { await copyFile(p, dest); kept.push(dest); } catch { kept.push(p); } } r.screenshots = kept; }
await record(iteration, results, note);
console.log(JSON.stringify(results.map((r) => ({ name: r.name, pass: r.pass, defects: r.defects.length }))));
