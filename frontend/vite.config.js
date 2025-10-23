import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const backendURL = 'https://college-hub.onrender.com'; // 🔁 Replace with your live backend URL

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
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
        : {}, // ✅ no proxy in production
  },
  define: {
    __BACKEND_URL__: JSON.stringify(
      mode === 'development' ? 'http://localhost:5000' : backendURL
    ),
  },
}));
