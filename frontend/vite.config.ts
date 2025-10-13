import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteMockServe } from 'vite-plugin-mock'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteMockServe({
        mockPath: 'mock',
        enable: true,
        watchFile: true,
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          clerk: ['@clerk/clerk-react'],
          starknet: ['@starknet-react/core', 'starknet'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
