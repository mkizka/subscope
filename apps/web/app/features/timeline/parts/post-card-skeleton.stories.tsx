import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostCardSkeleton } from "./post-card-skeleton";

const meta = {
  title: "features/Timeline/PostCardSkeleton",
  component: PostCardSkeleton,
} satisfies Meta<typeof PostCardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
