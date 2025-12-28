import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Flappy Bird Infinit',
        short_name: 'FlappyRO',
        description: 'Joc Flappy Bird Infinit în Română - Mod Offline',
        theme_color: '#4fc3f7',
        background_color: '#4fc3f7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://i.ibb.co/HLfD5wgf/dualite-favicon.png', // Folosim iconița existentă ca placeholder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://i.ibb.co/HLfD5wgf/dualite-favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
