// FILE: frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Node polyfill plugin (fixes simple-peer errors)
import { nodePolyfills } from "vite-plugin-node-polyfills";

const backendURL = "https://college-hub.onrender.com";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),

    // 🔥 Node polyfills for browser (FIX for simple-peer)
    nodePolyfills({
      protocolImports: true,
    }),
  ],

  build: { sourcemap: false },
  esbuild: { sourcemap: false },

  resolve: {
    alias: {
      // Your original aliases
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@styles": path.resolve(__dirname, "./src/styles"),

      // 🔥 Needed for simple-peer to avoid process.nextTick crash
      process: "process/browser",
      stream: "stream-browserify",
      util: "util",
    },
  },

  server: {
    port: 3000,
    host: true,
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: "http://localhost:5000",
              changeOrigin: true,
            },
            "/socket.io": {
              target: "http://localhost:5000",
              ws: true,
            },
          }
        : {},
  },

  define: {
    __BACKEND_URL__: JSON.stringify(
      mode === "development" ? "http://localhost:5000" : backendURL
    ),

    // 🔥 Fix for "global is not defined" (simple-peer requires this)
    global: "globalThis",

    // 🔥 Avoid "process.env undefined" issue
    "process.env": {},
  },

  optimizeDeps: {
    include: ["simple-peer"],
  },
}));
