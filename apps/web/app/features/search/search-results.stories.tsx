import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchResults } from "./search-results";

const meta = {
  component: SearchResults,
  args: {
    tab: "posts",
    accounts: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        description: "こんにちは",
      },
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
      },
    ],
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
  },
} satisfies Meta<typeof SearchResults>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Posts: Story = {};

export const Accounts: Story = {
  args: { tab: "accounts" },
};

export const NoAccounts: Story = {
  args: { tab: "accounts", accounts: [] },
};

export const NoPosts: Story = {
  args: { posts: [] },
};
