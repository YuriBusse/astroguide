import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  base: "/",
  server: {
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  plugins: [preact()],
  assetsInclude: ["**/*.wasm"],

  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom/client": "preact/compat/client",
      "react/jsx-runtime": "preact/jsx-runtime",
      "react/jsx-dev-runtime": "preact/jsx-dev-runtime",
    },
  },

  build: {
    target: "es2019",
  },
});
