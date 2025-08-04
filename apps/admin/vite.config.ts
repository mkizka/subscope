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
    noExternal: [
      "@atproto/xrpc",
      "@atproto/lexicon",
      "@atproto/oauth-client-node",
    ],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
