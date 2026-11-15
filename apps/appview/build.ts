import { build } from "esbuild";

await build({
  entryPoints: ["src/appview.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url); const __dirname = import.meta.dirname;',
  },
  outdir: "dist",
  logLevel: "info",
});
