import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostVideo } from "./post-video";

const meta = {
  component: PostVideo,
  args: {
    video: {
      playlist: "https://video.bsky.app/watch/did/cid/playlist.m3u8",
      thumbnail:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23d97757'/%3E%3C/svg%3E",
      alt: "サンプル動画",
      aspectRatio: { width: 16, height: 9 },
    },
  },
} satisfies Meta<typeof PostVideo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
