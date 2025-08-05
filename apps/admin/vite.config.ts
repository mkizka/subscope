import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: "./app/server.ts",
        }
      : undefined,
    sourcemap: true,
  },
  ssr: {
    // なぜかzodがundefinedになってしまうのでバンドルして対処
    // - @repo/client → ESM
    // - @atproto/lexicon → CJS
    // - zod → CJS
    // で、CJSからCJSの読み込みがViteのSSRビルドだとうまくいかない？
    noExternal: ["@repo/client", "@atproto/lexicon", "zod"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
