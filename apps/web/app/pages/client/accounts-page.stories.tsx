import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountsPage } from "./accounts-page";

const meta = {
  component: AccountsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
