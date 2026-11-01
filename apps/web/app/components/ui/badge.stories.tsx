import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta = {
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Status: Story = {
  args: { children: "有効" },
};

export const Count: Story = {
  args: { variant: "count", children: 3 },
};
