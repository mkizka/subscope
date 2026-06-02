import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodeTableContainer } from "@/app/features/admin/blocks/invite-code-table-container";
import { SubscriberTableContainer } from "@/app/features/admin/blocks/subscriber-table-container";

import { AdminLayout } from "./admin";

const meta = {
  title: "pages/admin",
  component: AdminLayout,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InviteCode: Story = {
  args: {
    children: <InviteCodeTableContainer />,
  },
};

export const Subscribers: Story = {
  args: {
    children: <SubscriberTableContainer />,
  },
};
