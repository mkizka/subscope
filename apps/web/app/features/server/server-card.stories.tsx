import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerCard } from "./server-card";

const meta = {
  component: ServerCard,
} satisfies Meta<typeof ServerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
