// Progress log: tools/critics/progress.json → progress.html with per-iteration critic results and screenshots.
import { readFile, writeFile } from 'node:fs/promises';
const FILE = 'tools/critics/progress.json';
export async function load() { try { return JSON.parse(await readFile(FILE, 'utf8')); } catch { return { iterations: [] }; } }
export async function record(iteration, results, note = '') {
  const log = await load();
  const entry = { iteration, at: new Date().toISOString(), note, results };
  const i = log.iterations.findIndex((e) => e.iteration === iteration);
  if (i >= 0) { const prev = log.iterations[i]; const merged = [...prev.results.filter((r) => !results.some((n) => n.name === r.name)), ...results]; log.iterations[i] = { ...entry, results: merged, note: note || prev.note }; } else log.iterations.push(entry);
  await writeFile(FILE, JSON.stringify(log, null, 2));
  await render(log);
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export async function render(log) {
  const critics = [...new Set(log.iterations.flatMap((e) => e.results.map((r) => r.name)))];
  const rows = log.iterations.map((e) => `<tr><td>${e.iteration}</td><td>${e.at.slice(0, 16).replace('T', ' ')}</td>${critics.map((c) => { const r = e.results.find((x) => x.name === c); if (!r) return '<td class="na">—</td>'; return `<td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}<br><small>${r.defects.length} defects</small></td>`; }).join('')}<td>${esc(e.note)}</td></tr>`).join('');
  const details = log.iterations.map((e) => `<section><h2>Iteration ${e.iteration} <small>${e.at}</small></h2>${e.results.map((r) => `<details ${r.pass ? '' : 'open'}><summary class="${r.pass ? 'pass' : 'fail'}">${esc(r.name)} — ${r.pass ? 'PASS' : 'FAIL'} (${r.defects.length} defects)</summary><ul>${r.defects.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><div class="shots">${(r.screenshots ?? []).map((s) => `<figure><img src="${s}" loading="lazy"><figcaption>${esc(s)}</figcaption></figure>`).join('')}</div></details>`).join('')}</section>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Enemy Unknown — build progress</title>
<style>body{font:14px/1.5 -apple-system,system-ui,sans-serif;background:#0b1020;color:#f8fafc;margin:0;padding:24px}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:16px 0}td,th{border:1px solid #334155;padding:8px;text-align:left;vertical-align:top}.pass{color:#48bb78}.fail{color:#ef4444}.na{color:#64748b}small{color:#94a3b8}details{border:1px solid #334155;border-radius:3px;padding:8px;margin:8px 0}summary{cursor:pointer;font-weight:600}.shots{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;width:420px}figure img{width:100%;border:1px solid #334155;border-radius:3px}figcaption{color:#94a3b8;font-size:12px}ul{margin:8px 0}</style></head>
<body><h1>Enemy Unknown (unaffiliated homage) — build-and-critique log</h1><p>Each iteration: critics run at iPad viewports, defects fed back to builders, fixes committed. Screenshots are the critics' captures.</p>
<table><thead><tr><th>#</th><th>When (UTC)</th>${critics.map((c) => `<th>${esc(c)}</th>`).join('')}<th>Note</th></tr></thead><tbody>${rows}</tbody></table>${details}</body></html>`;
  await writeFile('progress.html', html);
}
