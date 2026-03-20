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
        description: '40 IA spécialisées bâtiment : diagnostic, normes DTU, scanner, devis IA et plus.',
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
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/data\.ademe\.fr\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ademe-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/georisques\.gouv\.fr\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'georisques-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'meteo-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 3 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/api-adresse\.data\.gouv\.fr\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'adresse-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
