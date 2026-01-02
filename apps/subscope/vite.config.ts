import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3005,
  },
  plugins: [preact()],
});
