import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationBell } from "./notification-bell";

const meta = {
  component: NotificationBell,
  args: {
    unreadCount: 3,
  },
} satisfies Meta<typeof NotificationBell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
