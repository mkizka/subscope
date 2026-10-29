import type { Meta, StoryObj } from "@storybook/react-vite";

import TimelineFeedStories from "@/app/features/timeline/blocks/timeline-feed.stories";

import { TimelinePage } from "./timeline-page";

const meta = {
  component: TimelinePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelinePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    posts: TimelineFeedStories.args.posts,
  },
};
