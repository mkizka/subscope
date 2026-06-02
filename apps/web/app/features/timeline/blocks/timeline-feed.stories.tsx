import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { TimelineFeed } from "./timeline-feed";

const meta = {
  title: "features/Timeline/TimelineFeed",
  component: TimelineFeed,
  args: {
    posts: [
      {
        uri: "at://did:plc:example1/app.bsky.feed.post/1",
        authorHandle: "alice.bsky.social",
        authorDisplayName: "Alice",
        text: "こんにちは！今日はいい天気ですね。",
        replyCount: 3,
        repostCount: 5,
        likeCount: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        uri: "at://did:plc:example2/app.bsky.feed.post/2",
        authorHandle: "bob.bsky.social",
        authorDisplayName: "Bob",
        text: "AT Protocolについての考察。分散型SNSの未来について。",
        replyCount: 1,
        repostCount: 10,
        likeCount: 25,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        reasonRepost: {
          byDisplayName: "Charlie",
          byHandle: "charlie.bsky.social",
        },
      },
      {
        uri: "at://did:plc:example3/app.bsky.feed.post/3",
        authorHandle: "dave.bsky.social",
        text: "displayNameなしのユーザーです。",
        replyCount: 0,
        repostCount: 0,
        likeCount: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    onLoadMore: fn(),
  },
} satisfies Meta<typeof TimelineFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    posts: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};

export const LoadingMore: Story = {
  args: {
    isFetchingNextPage: true,
    hasNextPage: true,
  },
};
