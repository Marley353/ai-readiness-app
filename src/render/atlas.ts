import { Assets, Sprite, Texture, Spritesheet } from 'pixi.js';

const textures = new Map<string, Texture>();
let loaded = false;
const missing = new Set<string>();

export async function loadAtlases() {
  if (loaded) return;
  let pages: string[] = [];
  try { const idx = await fetch('./atlas/index.json').then((r) => (r.ok ? r.json() : { pages: [] })); pages = idx.pages ?? []; } catch { pages = []; }
  for (const page of pages) {
    const sheet = (await Assets.load(`./atlas/${page}.json`)) as Spritesheet;
    sheet.textureSource.scaleMode = 'nearest';
    for (const [k, t] of Object.entries(sheet.textures)) textures.set(k, t);
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
