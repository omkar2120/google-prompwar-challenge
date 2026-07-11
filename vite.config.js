import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      },
      includeAssets: [
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'robots.txt',
      ],
      manifest: {
        name: 'MonsoonMitra — Monsoon Preparedness',
        short_name: 'MonsoonMitra',
        description:
          'Personalized, multilingual, real-time monsoon survival plans for every household.',
        theme_color: '#0b0f19',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Split heavy, independently-loaded libraries so no single chunk balloons
    // (also avoids a workbox/terser race during service-worker generation).
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          pdf: ['jspdf'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/lib/**', 'src/hooks/**', 'src/store/**'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/lib/firebase.js',
        'src/sw.js',
      ],
    },
  },
});
