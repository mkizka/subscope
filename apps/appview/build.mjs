import { build } from "esbuild";

await build({
  entryPoints: ["src/appview.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: {
    "@repo/common": "../../packages/common/src",
    "@repo/db": "../../packages/db/src",
  },
  outdir: "dist",
  logLevel: "info",
});
