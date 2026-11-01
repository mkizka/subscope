import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadPage } from "./thread-page";

const post = (uri: string, text: string) => ({
  uri,
  cid: "bafyexample",
  authorDisplayName: "Alice",
  authorHandle: "alice.bsky.social",
  text,
  createdAt: new Date().toISOString(),
});

const meta = {
  component: ThreadPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    thread: {
      ancestors: [post("at://a/1", "親投稿です")],
      post: {
        ...post("at://a/2", "選んだ投稿です"),
        replyCount: 1,
        repostCount: 1,
        likeCount: 8,
      },
      replies: [
        [post("at://a/3", "返信です"), post("at://a/4", "返信への返信です")],
      ],
    },
  },
} satisfies Meta<typeof ThreadPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
