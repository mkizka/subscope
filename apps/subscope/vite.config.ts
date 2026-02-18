import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://v2.remix.run/docs/guides/vite
const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: "./server/bootstrap/server.ts",
          external: [/^@atproto\//, /^@atproto-labs\//],
        }
      : undefined,
  },
  plugins: [tailwindcss(), !isStorybook && reactRouter(), tsconfigPaths()],
}));
