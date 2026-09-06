// Single-file build support. tools/bundle-single.mjs inlines the sprite atlas and every sound as data URIs on
// window.__ufoBundle so the game runs from one HTML file with no further requests; the normal build never sets it.
export interface Bundle {
  atlasIndex: { pages: string[] };
  atlasPages: Record<string, { json: unknown; png: string }>;
  audioManifest: Record<string, string>;
  audio: Record<string, string>;
}
export const bundle = (): Bundle | undefined => (globalThis as { __ufoBundle?: Bundle }).__ufoBundle;
