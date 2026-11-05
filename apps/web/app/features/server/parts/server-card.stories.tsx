import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerCard } from "./server-card";

const meta = {
  component: ServerCard,
  args: { registeredCount: "3", trackedCount: 128 },
} satisfies Meta<typeof ServerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { registeredCount: undefined, trackedCount: undefined },
};
