import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfilePage } from "./profile-page";

const meta = {
  component: ProfilePage,
  args: {
    handle: "alice.bsky.social",
    displayName: "Alice",
    description: "Blueskyを使っています。",
    followsCount: 120,
    followersCount: 345,
    follow: { did: "did:plc:alice" },
    tabs: ["posts", "replies"],
    tab: "posts",
    posts: [
      {
        uri: "at://did:plc:alice/app.bsky.feed.post/1",
        cid: "bafyreia",
        authorHandle: "alice.bsky.social",
        authorDisplayName: "Alice",
        text: "こんにちは！今日はいい天気ですね。",
        replyCount: 3,
        repostCount: 5,
        likeCount: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
