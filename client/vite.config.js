import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: true,

    proxy: {
      // Proxy ALL API calls to backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads (images, videos) to backend
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
