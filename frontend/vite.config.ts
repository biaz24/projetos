import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/usuarios": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/ideias": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/comentarios": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/favoritos": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});