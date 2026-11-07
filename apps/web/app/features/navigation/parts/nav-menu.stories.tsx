import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavMenu } from "./nav-menu";

const meta = {
  component: NavMenu,
  args: {
    profileId: "alice.bsky.social",
  },
} satisfies Meta<typeof NavMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithServer: Story = {
  args: {
    showServer: true,
  },
};

export const WithoutProfile: Story = {
  args: {
    profileId: undefined,
  },
};
