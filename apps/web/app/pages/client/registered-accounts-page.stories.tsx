import type { Meta, StoryObj } from "@storybook/react-vite";

import { RegisteredAccountsPage } from "./registered-accounts-page";

const meta = {
  component: RegisteredAccountsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RegisteredAccountsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
