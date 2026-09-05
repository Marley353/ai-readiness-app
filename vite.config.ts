import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 4000, assetsInlineLimit: 0 },
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
