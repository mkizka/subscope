import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchPage } from "./search-page";

const meta = {
  component: SearchPage,
  args: {
    q: "alice",
    tab: "actors",
    posts: [],
    actors: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        description: "Blueskyを使っています。",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SearchPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const NotFound: StoryObj<typeof meta> = {
  args: { actors: [] },
};

export const Posts: StoryObj<typeof meta> = {
  args: {
    tab: "posts",
    posts: [
      {
        uri: "at://did:plc:alice/app.bsky.feed.post/1",
        cid: "bafyreia",
        authorHandle: "alice.bsky.social",
        authorDisplayName: "Alice",
        text: "aliceについての投稿です",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  },
};

export const PostsNotFound: StoryObj<typeof meta> = {
  args: { tab: "posts" },
};

export const Empty: StoryObj<typeof meta> = {
  args: { q: undefined, actors: [] },
};
