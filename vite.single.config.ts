import { defineConfig } from 'vite';
// Single-chunk build consumed by tools/bundle-single.mjs (everything ends up inlined in one HTML file).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 8000, assetsInlineLimit: 0,
    outDir: 'dist-single', emptyOutDir: true, modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
} as any);
