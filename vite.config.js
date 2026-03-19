import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/maestromind/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MAESTROMIND — IA Bâtiment',
        short_name: 'MAESTROMIND',
        description: '32 IA spécialisées bâtiment : diagnostic, normes DTU, scanner AR, devis et plus.',
        theme_color: '#C9A84C',
        background_color: '#06080D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/maestromind/',
        start_url: '/maestromind/',
        icons: [
          { src: '/maestromind/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/maestromind/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
