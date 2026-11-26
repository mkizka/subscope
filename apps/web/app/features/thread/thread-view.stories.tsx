import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadView } from "./thread-view";

const post = ({
  id,
  text,
  handle = "alice.bsky.social",
}: {
  id: number;
  text: string;
  handle?: string;
}) => ({
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
      ancestors: [post({ id: 1, text: "親投稿です" })],
      post: {
        ...post({ id: 2, text: "選んだ投稿です", handle: "bob.bsky.social" }),
        replyCount: 2,
        repostCount: 3,
        quoteCount: 2,
        likeCount: 8,
      },
      replies: [
        [
          post({ id: 3, text: "返信です" }),
          post({ id: 4, text: "返信への返信です", handle: "bob.bsky.social" }),
        ],
        [post({ id: 5, text: "別の返信です" })],
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
      post: post({ id: 2, text: "返信のない投稿です" }),
      replies: [],
    },
  },
};
