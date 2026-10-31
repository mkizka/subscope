import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListPage } from "./list-page";

const meta = {
  component: ListPage,
  args: {
    name: "友達",
    description: "よく話す人たち",
    tab: "posts",
    isSelf: true,
    posts: [
      {
        uri: "at://did:plc:bob/app.bsky.feed.post/1",
        cid: "bafyreia",
        authorHandle: "bob.bsky.social",
        authorDisplayName: "Bob",
        text: "こんにちは！",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
    members: [
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ListPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const Members: StoryObj<typeof meta> = {
  args: { tab: "members" },
};
