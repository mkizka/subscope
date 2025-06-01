import { build } from "esbuild";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

await build({
  entryPoints: ["src/api.ts", "src/server.ts"],
  bundle: true,
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  platform: "node",
  format: "esm",
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
});
