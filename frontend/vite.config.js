import { resolve } from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// App multi-página: cada HTML é um entry point independente.
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        generator: resolve(__dirname, 'generator.html'),
        manual: resolve(__dirname, 'manual.html'),
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: false, // usamos public/manifest.json (versionado)
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
        navigateFallback: null,
      },
    }),
  ],
});
