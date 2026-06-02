import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatusBadge } from "./status-badge";

const meta = {
  title: "features/Admin/StatusBadge",
  component: StatusBadge,
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    expiresAt: "2099-12-31T23:59:59.000Z",
  },
};

export const Used: Story = {
  args: {
    usedAt: "2025-01-15T10:00:00.000Z",
    expiresAt: "2099-12-31T23:59:59.000Z",
  },
};

export const Expired: Story = {
  args: {
    expiresAt: "2020-01-01T00:00:00.000Z",
  },
};
