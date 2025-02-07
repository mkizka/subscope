import { build } from "esbuild";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
});
