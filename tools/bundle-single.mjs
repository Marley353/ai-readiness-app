// Self-contained build: dist-single/index.html (standalone page) and dist-single/artifact.html (body-only variant
// for hosts that wrap a page in their own document skeleton). Code, CSS, fonts, the sprite atlas and every sound
// are inlined, so the game runs from one file with no further requests. Usage: npm run build:single
import { readFile, writeFile, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
execSync('npx vite build --config vite.single.config.ts', { stdio: 'inherit' });
const dir = 'dist-single';
const read = (p) => readFile(p, 'utf8');
const b64 = async (p) => (await readFile(p)).toString('base64');
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const html = await read(`${dir}/index.html`);
const jsRef = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/);
const cssRef = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/);
if (!jsRef) throw new Error('bundle-single: no module script found in the built index.html');
const js = safe(await read(`${dir}/${jsRef[1]}`));
let css = cssRef ? await read(`${dir}/${cssRef[1]}`) : '';
// Keep only the Latin faces the UI uses, inlined; drop the other subsets and the legacy woff fallbacks.
css = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => (/-latin-\d{3}-/.test(block) ? block : ''));
css = css.replace(/,\s*url\([^)]*\.woff\)\s*format\(["']?woff["']?\)/g, '');
const fontUrls = [...new Set([...css.matchAll(/url\((?:"|')?([^)"']+\.woff2)(?:"|')?\)/g)].map((m) => m[1]))];
for (const f of fontUrls) {
  const data = `url(data:font/woff2;base64,${await b64(`${dir}/assets/${f.split('/').pop()}`)})`;
  css = css.split(`url(${f})`).join(data).split(`url("${f}")`).join(data).split(`url('${f}')`).join(data);
}
const atlasIndex = JSON.parse(await read('public/atlas/index.json'));
const atlasPages = {};
for (const page of atlasIndex.pages) atlasPages[page] = { json: JSON.parse(await read(`public/atlas/${page}.json`)), png: `data:image/png;base64,${await b64(`public/atlas/${page}.png`)}` };
const audioManifest = JSON.parse(await read('public/audio/manifest.json'));
const audio = {};
for (const file of new Set(Object.values(audioManifest))) audio[file] = `data:audio/wav;base64,${await b64(`public/audio/${file}`)}`;
const bundleScript = `<script>window.__ufoBundle=${safe(JSON.stringify({ atlasIndex, atlasPages, audioManifest, audio }))}</script>`;
const icon = `data:image/png;base64,${await b64('public/icons/icon-192.png')}`;
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
  .replace(/\s*<script type="module"[^>]*><\/script>/, '').replace(/\s*<link rel="modulepreload"[^>]*>/g, '').replace(/\s*<link rel="stylesheet"[^>]*>/, '')
  .replace(/\s*<link rel="manifest"[^>]*>/, '').replace(/href="\.\/icons\/[^"]+"/g, `href="${icon}"`);
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).trim();
const scripts = `${bundleScript}\n<script type="module">${js}</script>`;
await writeFile(`${dir}/index.html`, `<!doctype html>\n<html lang="en">\n<head>${head}\n  <style>${css}</style>\n</head>\n<body>\n${body}\n${scripts}\n</body>\n</html>\n`);
const metas = (head.match(/<meta[^>]*>/g) ?? []).filter((m) => !/charset/.test(m)).join('\n');
const style = head.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '';
await writeFile(`${dir}/artifact.html`, `<title>Enemy Unknown</title>\n${metas}\n${style}\n<style>${css}</style>\n${body}\n${scripts}\n`);
await rm(`${dir}/assets`, { recursive: true, force: true });
const size = (await readFile(`${dir}/index.html`)).length;
console.log(`bundle-single: ${dir}/index.html ${(size / 1048576).toFixed(1)} MB, ${fontUrls.length} fonts inlined, ${Object.keys(audio).length} sounds, ${atlasIndex.pages.length} atlas page(s)`);
