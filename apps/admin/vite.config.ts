import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode, isSsrBuild }) => {
  // https://vite.dev/config/#using-environment-variables-in-config
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = env.PUBLIC_URL ? [new URL(env.PUBLIC_URL).hostname] : [];

  return {
    build: {
      rollupOptions: isSsrBuild
        ? {
            input: "./app/server.ts",
          }
        : undefined,
      sourcemap: true,
    },
    server: {
      allowedHosts,
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
  };
});
