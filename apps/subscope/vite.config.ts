import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

// https://v2.remix.run/docs/guides/vite
const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHosts: string[] = [];
  if (env.PUBLIC_URL) {
    const publicUrl = new URL(env.PUBLIC_URL);
    allowedHosts.push(publicUrl.hostname);
  }

  return {
    server: {
      port: env.PORT ? Number(env.PORT) : 3000,
      allowedHosts,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss(), !isStorybook && reactRouter()],
  };
});
