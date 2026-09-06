// Fidelity: runs every rules test (builders' vitest suites + tests/fidelity/sample20) and reports failures as defects.
import { spawn } from 'node:child_process';
export async function run() {
  const out = await new Promise((res) => { const p = spawn('npx', ['vitest', 'run', '--reporter=json'], { cwd: process.cwd() }); let s = ''; p.stdout.on('data', (d) => (s += d)); p.stderr.on('data', (d) => (s += d)); p.on('close', () => res(s)); });
  const defects = [];
  let json = null;
  try { json = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch { defects.push('vitest produced no JSON report: ' + out.slice(0, 300)); }
  if (json) {
    for (const f of json.testResults ?? []) {
      if (f.status !== 'passed') { for (const t of f.assertionResults ?? []) if (t.status === 'failed') defects.push(`${f.name.split('/').slice(-2).join('/')} › ${t.fullName}: ${(t.failureMessages?.[0] ?? '').split('\n')[0].slice(0, 160)}`); if (!(f.assertionResults ?? []).length) defects.push(`${f.name.split('/').slice(-2).join('/')}: ${(f.message ?? 'suite failed').split('\n')[0].slice(0, 200)}`); }
    }
    if ((json.numTotalTests ?? 0) < 20) defects.push(`only ${json.numTotalTests ?? 0} rule tests exist (need the 20-rule sample plus builders' suites)`);
  }
  return { pass: defects.length === 0, defects: defects.slice(0, 80), screenshots: [], metrics: json ? { tests: json.numTotalTests, passed: json.numPassedTests, failed: json.numFailedTests } : {} };
}
