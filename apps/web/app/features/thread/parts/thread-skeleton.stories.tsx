import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadSkeleton } from "./thread-skeleton";

const meta = {
  component: ThreadSkeleton,
} satisfies Meta<typeof ThreadSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
