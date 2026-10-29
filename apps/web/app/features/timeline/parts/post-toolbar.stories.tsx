import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { PostToolbar } from "./post-toolbar";

const meta = {
  component: PostToolbar,
  args: {
    liked: false,
    reposted: false,
    onLike: fn(),
    onRepost: fn(),
    onReply: fn(),
    onQuote: fn(),
  },
  decorators: (Story) => (
    <div className="group relative h-12 w-64">
      <Story />
    </div>
  ),
} satisfies Meta<typeof PostToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
