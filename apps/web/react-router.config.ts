import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  buildDirectory: "dist",
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
