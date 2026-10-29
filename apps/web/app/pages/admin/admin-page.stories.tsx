import type { Meta, StoryObj } from "@storybook/react-vite";

import { SubscriberListContainer } from "@/app/features/admin/blocks/subscriber-list-container";

import { AdminPage } from "./admin-page";

const meta = {
  component: AdminPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Subscribers: Story = {
  args: {
    children: <SubscriberListContainer />,
  },
};
