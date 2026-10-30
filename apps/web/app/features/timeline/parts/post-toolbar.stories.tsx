import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { PostToolbar } from "./post-toolbar";

const meta = {
  component: PostToolbar,
  args: {
    replyCount: 3,
    repostCount: 5,
    likeCount: 12,
    liked: false,
    reposted: false,
    onLike: fn(),
    onRepost: fn(),
    onReply: fn(),
    onQuote: fn(),
  },
} satisfies Meta<typeof PostToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
