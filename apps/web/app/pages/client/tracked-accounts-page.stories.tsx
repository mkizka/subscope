import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrackedAccountsPage } from "./tracked-accounts-page";

const meta = {
  component: TrackedAccountsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TrackedAccountsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
