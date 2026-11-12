import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadView } from "./thread-view";

const post = (id: number, text: string, handle = "alice.bsky.social") => ({
  uri: `at://did:plc:example/app.bsky.feed.post/${id}`,
  cid: `bafyexample${id}`,
  authorHandle: handle,
  authorDisplayName: handle === "alice.bsky.social" ? "Alice" : "Bob",
  text,
  createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
});

const meta = {
  component: ThreadView,
  args: {
    thread: {
      ancestors: [post(1, "親投稿です")],
      post: {
        ...post(2, "選んだ投稿です", "bob.bsky.social"),
        replyCount: 2,
        repostCount: 3,
        quoteCount: 2,
        likeCount: 8,
      },
      replies: [
        [post(3, "返信です"), post(4, "返信への返信です", "bob.bsky.social")],
        [post(5, "別の返信です")],
      ],
    },
  },
} satisfies Meta<typeof ThreadView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoAncestorsAndReplies: Story = {
  args: {
    thread: {
      ancestors: [],
      post: post(2, "返信のない投稿です"),
      replies: [],
    },
  },
};
