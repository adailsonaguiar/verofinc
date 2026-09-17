import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      workbox: {
        runtimeCaching: [
          {
            // Cache all API calls with NetworkFirst — falls back to SW cache offline
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api') || url.pathname.startsWith('/transactions') || url.pathname.startsWith('/accounts') || url.pathname.startsWith('/categories'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'verofinc-api-v1',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24, // 24h
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Cache the classic typefaces so the editorial layout survives offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'verofinc-fonts-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'VeroFinc - Gerenciador Financeiro',
        short_name: 'VeroFinc',
        description: 'Seu gerenciador financeiro pessoal de alta performance.',
        theme_color: '#0e1628', // navy-900
        background_color: '#f7f6f2', // bone
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
