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

      "/rascunhos": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/curtidas": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/denuncias": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/esqueci-senha": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/redefinir-senha": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass(req) {
          // Se for uma navegação para abrir a página,
          // deixa o React/Vite entregar o index.html.
          if (req.headers.accept?.includes("text/html")) {
            return "/index.html";
          }
        },
      },
    },
  },
});
