import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://back.monvravex.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: ""
      }
    }
  },
  build: {
    target: "es2022",
    sourcemap: true
  }
});
