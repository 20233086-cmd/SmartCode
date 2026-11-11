import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["src/test/**/*.test.jsx"] },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8000", ws: true } },
  },
  build: { chunkSizeWarningLimit: 4500 },
});
