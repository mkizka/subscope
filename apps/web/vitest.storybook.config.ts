import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";

export default defineProject({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    storybookTest({
      configDir: fileURLToPath(new URL(".storybook", import.meta.url)),
    }),
  ],
  test: {
    name: "web:storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
