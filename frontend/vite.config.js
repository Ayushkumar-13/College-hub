import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Node polyfill plugin (fixes simple-peer errors)
import { nodePolyfills } from "vite-plugin-node-polyfills";

const PROD_BACKEND_URL = "https://college-hub.onrender.com";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devBackendUrl = env.VITE_BACKEND_URL || "http://127.0.0.1:5050";

  return {
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
              target: devBackendUrl,
              changeOrigin: true,
              secure: false,
              configure: (proxy) => {
                proxy.on("error", (err, _req, res) => {
                  if (res && !res.headersSent) {
                    res.writeHead(503, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        success: false,
                        error: `Cannot reach API at ${devBackendUrl}. Start backend: cd backend && npm run dev`,
                      })
                    );
                  }
                });
              },
            },
            "/socket.io": {
              target: devBackendUrl,
              ws: true,
              changeOrigin: true,
              secure: false,
            },
          }
        : {},
  },

  define: {
    __BACKEND_URL__: JSON.stringify(
      mode === "development" ? devBackendUrl : PROD_BACKEND_URL
    ),

    // 🔥 Fix for "global is not defined" (simple-peer requires this)
    global: "globalThis",

    // 🔥 Avoid "process.env undefined" issue
    "process.env": {},
  },

  optimizeDeps: {
    include: ["simple-peer"],
  },
};
});
