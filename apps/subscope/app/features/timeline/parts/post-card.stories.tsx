import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostCard } from "./post-card";

const meta = {
  title: "features/Timeline/PostCard",
  component: PostCard,
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    authorHandle: "alice.bsky.social",
    authorDisplayName: "Alice",
    text: "こんにちは！今日はいい天気ですね。",
    replyCount: 3,
    repostCount: 5,
    likeCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
};

export const WithRepost: Story = {
  args: {
    authorHandle: "bob.bsky.social",
    authorDisplayName: "Bob",
    text: "AT Protocolについての考察。分散型SNSの未来について。",
    replyCount: 1,
    repostCount: 10,
    likeCount: 25,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reasonRepost: {
      byDisplayName: "Alice",
      byHandle: "alice.bsky.social",
    },
  },
};

export const NoDisplayName: Story = {
  args: {
    authorHandle: "charlie.bsky.social",
    text: "displayNameが未設定のユーザーの投稿です。",
    replyCount: 0,
    repostCount: 0,
    likeCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
};

export const LongText: Story = {
  args: {
    authorHandle: "dave.bsky.social",
    authorDisplayName: "Dave",
    text: "これは非常に長いテキストの投稿です。AT Protocolは分散型のソーシャルネットワーキングプロトコルで、ユーザーが自身のデータを管理できることを目指しています。Blueskyはこのプロトコルを使用した最初のアプリケーションです。Subscopeは省ストレージを目指した互換Appviewの実装です。",
    replyCount: 7,
    repostCount: 15,
    likeCount: 42,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
};
