import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountList } from "./account-list";

const meta = {
  component: AccountList,
  args: {
    accounts: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        description: "Blueskyを使っています。",
        registeredFollowersCount: 3,
      },
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
        isAdmin: true,
        backfillStatus: "completed",
      },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
        backfillStatus: "error",
      },
    ],
  },
} satisfies Meta<typeof AccountList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { accounts: [] } };
