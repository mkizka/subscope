import type { Meta, StoryObj } from "@storybook/react-vite";

import { BottomTabs } from "./bottom-tabs";

const meta = {
  component: BottomTabs,
  args: {
    profileId: "alice.bsky.social",
    unreadCount: 0,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BottomTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unread: Story = {
  args: {
    unreadCount: 3,
  },
};
