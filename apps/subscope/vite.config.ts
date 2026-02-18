import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://v2.remix.run/docs/guides/vite
const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHosts: string[] = [];
  if (env.PUBLIC_URL) {
    const publicUrl = new URL(env.PUBLIC_URL);
    allowedHosts.push(publicUrl.hostname);
  }

  return {
    server: {
      allowedHosts,
    },
    build: {
      rollupOptions: isSsrBuild
        ? {
            input: "./server/bootstrap/server.ts",
            external: [/^@atproto\//, /^@atproto-labs\//],
          }
        : undefined,
    },
    plugins: [tailwindcss(), !isStorybook && reactRouter(), tsconfigPaths()],
  };
});
