import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../app/{components,features}/**/*.stories.tsx",
    { directory: "../app/pages/admin", titlePrefix: "pages" },
    { directory: "../app/pages/client", titlePrefix: "pages" },
  ],
  staticDirs: ["../public"],
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-vitest"],
  tags: { "play-fn": { defaultFilterSelection: "exclude" } },
};

export default config;
