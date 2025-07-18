import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/api.ts", "src/server.ts"],
  format: "esm",
  sourcemap: true,
  clean: true,
  outExtension: () => ({ js: ".mjs" }),
});
