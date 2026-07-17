import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    base: isProduction ? "/zimhub/" : "/",
    server: {
      port: 5173,
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/api": { target: "http://localhost:5000", changeOrigin: true },
        "/uploads": { target: "http://localhost:5000", changeOrigin: true },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  };
});
