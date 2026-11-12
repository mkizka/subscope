import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../app/**/*.stories.tsx"],
  staticDirs: ["../public"],
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-vitest"],
  tags: { "play-fn": { defaultFilterSelection: "exclude" } },
};

export default config;
