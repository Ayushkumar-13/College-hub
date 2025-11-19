// FILE: frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const backendURL = 'https://college-hub.onrender.com'; // Live backend URL

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  
  // Prevent Vite source-map parsing errors
  build: { sourcemap: false },
  esbuild: { sourcemap: false },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@context': path.resolve(__dirname, './src/context'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@api': path.resolve(__dirname, './src/api'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },

  server: {
    port: 3000,
    host: true,
    proxy:
      mode === 'development'
        ? {
            '/api': {
              target: 'http://localhost:5000',
              changeOrigin: true,
            },
            '/socket.io': {
              target: 'http://localhost:5000',
              ws: true,
            },
          }
        : {},
  },

  define: {
    // Backend URL depending on mode
    __BACKEND_URL__: JSON.stringify(
      mode === 'development' ? 'http://localhost:5000' : backendURL
    ),

    // 🔥 FIX for simple-peer "global is not defined"
    global: 'globalThis',

    // 🔥 Fix "process.env undefined" from some libraries
    'process.env': {},
  },

  optimizeDeps: {
    include: ['simple-peer'], // Required for WebRTC bundling
  },
}));
