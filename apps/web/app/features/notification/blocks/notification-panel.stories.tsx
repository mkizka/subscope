import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationPanel } from "./notification-panel";

const meta = {
  component: NotificationPanel,
  args: {
    notifications: [
      {
        uri: "at://did:plc:alice/app.bsky.feed.like/1",
        authorName: "Alice",
        reason: "like",
        text: "いいねされた投稿",
        isRead: false,
      },
      {
        uri: "at://did:plc:bob/app.bsky.feed.repost/1",
        authorName: "Bob",
        reason: "repost",
        text: "リポストされた投稿",
        isRead: true,
      },
      {
        uri: "at://did:plc:carol/app.bsky.graph.follow/1",
        authorName: "Carol",
        reason: "follow",
        isRead: true,
      },
      {
        uri: "at://did:plc:dave/app.bsky.feed.post/1",
        authorName: "Dave",
        reason: "reply",
        text: "返信の本文",
        isRead: true,
      },
    ],
    onLoadMore: () => {},
    hasNextPage: false,
  },
} satisfies Meta<typeof NotificationPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
