import { build } from "esbuild";

import pkg from "./package.json" with { type: "json" };

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
});
