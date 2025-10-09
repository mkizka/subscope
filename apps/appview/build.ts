import { build } from "esbuild";

await build({
  entryPoints: ["./src/appview.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist",
  banner: {
    // commonjs用ライブラリをESMプロジェクトでbundleする際に生じることのある問題への対策
    js: `\
import { createRequire as topLevelCreateRequire  } from "module";
import * as __url from "url";
const require = topLevelCreateRequire(import.meta.url);
const __filename = __url.fileURLToPath(import.meta.url);
const __dirname = __url.fileURLToPath(new URL(".", import.meta.url));`,
  },
});
