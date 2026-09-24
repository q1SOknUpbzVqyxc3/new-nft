import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { handleNftNewsRequest } from "./server/nft-news.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      // Serves /news/nft in `vite dev` the same way server.mjs and the Vercel function do in production.
      name: "nft-news-dev",
      configureServer(server) {
        server.middlewares.use("/news/nft", (request, response) => {
          void handleNftNewsRequest(new URL(`/news/nft${request.url ?? ""}`, "http://localhost")).then(([status, headers, body]) => {
            response.writeHead(status, headers);
            response.end(body);
          });
        });
      }
    }
  ],
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
