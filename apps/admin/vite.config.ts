import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { UserConfig } from "vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode, isSsrBuild }) => {
  const configs: UserConfig = {
    build: {
      rollupOptions: isSsrBuild
        ? {
            input: "./app/server/inject.ts",
          }
        : undefined,
    },
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  };

  // https://vite.dev/config/#using-environment-variables-in-config
  const env = loadEnv(mode, process.cwd(), "");
  if (env.NODE_ENV === "development" && env.PUBLIC_URL) {
    configs.server = {
      // PUBLIC_URLにドメインを指定してcloudflare tunnel経由のアクセスを許可
      allowedHosts: [new URL(env.PUBLIC_URL).hostname],
    };
  }

  if (mode === "production") {
    // なぜか本番ビルドだけzodがundefinedになってしまうのでバンドルして対処
    // - @repo/client → ESM
    // - @atproto/lexicon → CJS
    // - zod → CJS
    // で、CJSからCJSの読み込みがViteのSSRビルドだとうまくいかない？
    configs.ssr = {
      noExternal: ["@repo/client", "@atproto/lexicon", "zod"],
    };
  }

  return configs;
});
