import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodeTableContainer } from "@/app/features/admin/blocks/invite-code-table-container";
import { SubscriberTableContainer } from "@/app/features/admin/blocks/subscriber-table-container";

import { AdminPage } from "./admin-page";

const meta = {
  component: AdminPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminPage>;

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
