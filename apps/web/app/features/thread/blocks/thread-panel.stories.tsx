import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadPanel } from "./thread-panel";

const post = (uri: string, text: string) => ({
  uri,
  cid: "bafyexample",
  authorDisplayName: "Alice",
  authorHandle: "alice.bsky.social",
  text,
  createdAt: new Date().toISOString(),
});

const meta = {
  component: ThreadPanel,
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
    closeSearch: "",
    onCompose: () => {},
  },
} satisfies Meta<typeof ThreadPanel>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
