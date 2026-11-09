import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../app/**/*.stories.tsx"],
  staticDirs: ["../public"],
  framework: "@storybook/react-vite",
};

export default config;
