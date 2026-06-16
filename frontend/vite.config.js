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
        admin: resolve(__dirname, 'admin.html'),
        library: resolve(__dirname, 'library.html'),
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
        // Assets com hash entram no precache; os HTML passam a ser servidos via
        // runtimeCaching StaleWhileRevalidate (#M19): resposta imediata do cache
        // e atualização em segundo plano, evitando servir HTML defasado.
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.mode === 'navigate' || request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'html-pages',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});
