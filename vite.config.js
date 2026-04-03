import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'manifest.json',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Hafiz JI Accounts',
        short_name: 'Hafiz JI',
        description: 'Store, Supplier, and Sales Management Tool',
        theme_color: '#198754',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 4000,       
    host: true,
  },
})
