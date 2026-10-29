import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadPanel } from "./thread-panel";

const post = (uri: string, text: string) => ({
  uri,
  authorDisplayName: "Alice",
  authorHandle: "alice.bsky.social",
  text,
  createdAt: new Date().toISOString(),
});

const meta = {
  component: ThreadPanel,
  args: {
    posts: [
      post("at://a/1", "親投稿です"),
      post("at://a/2", "選んだ投稿です"),
      post("at://a/3", "返信です"),
    ],
    closeSearch: "",
  },
} satisfies Meta<typeof ThreadPanel>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
