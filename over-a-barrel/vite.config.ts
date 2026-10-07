import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths: works at a domain root (Railway) or inside a sub-path.
  base: './',
  // poly2tri's CommonJS entry pokes at Node's `global`.
  define: { global: 'globalThis' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
