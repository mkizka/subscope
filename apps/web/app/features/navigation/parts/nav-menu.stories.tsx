import type { Meta, StoryObj } from "@storybook/react-vite";

import { AdminNavMenu, NavMenu } from "./nav-menu";

const meta = {
  component: NavMenu,
  args: {
    profileId: "alice.bsky.social",
  },
} satisfies Meta<typeof NavMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutProfile: Story = {
  args: {
    profileId: undefined,
  },
};

export const Admin: Story = {
  render: () => <AdminNavMenu />,
};
