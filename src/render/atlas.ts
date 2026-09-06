import { Assets, Sprite, Texture, Spritesheet, type SpritesheetData } from 'pixi.js';
import { bundle } from '../app/bundle';

const textures = new Map<string, Texture>();
let loaded = false;
const missing = new Set<string>();

function keep(sheet: Spritesheet) {
  sheet.textureSource.scaleMode = 'nearest';
  for (const [k, t] of Object.entries(sheet.textures)) textures.set(k, t);
}
async function loadBundled(b: NonNullable<ReturnType<typeof bundle>>) {
  for (const page of b.atlasIndex.pages ?? []) {
    const pg = b.atlasPages[page];
    if (!pg) continue;
    try {
      const img = new Image();
      img.src = pg.png;
      await img.decode();
      const sheet = new Spritesheet(Texture.from(img), pg.json as SpritesheetData);
      await sheet.parse();
      keep(sheet);
    } catch (e) { console.warn(`atlas: failed to load bundled page ${page}`, e); }
  }
}
export async function loadAtlases() {
  if (loaded) return;
  const b = bundle();
  if (b) { await loadBundled(b); loaded = true; return; }
  let pages: string[] = [];
  try { const idx = await fetch('./atlas/index.json').then((r) => (r.ok ? r.json() : { pages: [] })); pages = idx.pages ?? []; } catch { pages = []; }
  for (const page of pages) {
    try { keep((await Assets.load(`./atlas/${page}.json`)) as Spritesheet); } catch (e) { console.warn(`atlas: failed to load page ${page}`, e); }
  }
  loaded = true;
}
export const has = (key: string) => textures.has(key);
export function tex(key: string): Texture {
  const t = textures.get(key);
  if (t) return t;
  if (!missing.has(key)) { missing.add(key); console.warn(`atlas: missing sprite ${key}`); }
  return Texture.WHITE;
}
export function sprite(key: string): Sprite { const s = new Sprite(tex(key)); s.label = key; return s; }
/** All keys starting with a prefix, sorted. */
export const frames = (prefix: string) => [...textures.keys()].filter((k) => k.startsWith(prefix)).sort();
export const missingKeys = () => [...missing];
export const atlasKeys = () => [...textures.keys()];
