import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const target = process.env.VITE_PROXY_TARGET ?? "http://localhost:3000";

// In dev, /api, /health and /admin are forwarded to the backend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": target,
      "/health": target,
      "/admin": target,
      "/auth": target,
    },
  },
});
