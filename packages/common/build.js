import { build } from "esbuild";

import pkg from "./package.json" with { type: "json" };

await build({
  entryPoints: ["src/domain.ts", "src/infrastructure.ts", "src/utils.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
});
