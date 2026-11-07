import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerMemberList } from "./server-member-list";

const meta = {
  component: ServerMemberList,
} satisfies Meta<typeof ServerMemberList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    serverMembers: [
      {
        did: "did:plc:example123",
        handle: "alice.bsky.social",
        displayName: "Alice",
        avatar: "https://placehold.co/32",
        isAdmin: true,
        registeredAt: "2024-01-03T00:00:00.000Z",
        backfillStatus: "completed",
      },
      {
        did: "did:plc:example456",
        handle: "bob.bsky.social",
        displayName: "Bob",
        isAdmin: false,
        registeredAt: "2024-01-02T00:00:00.000Z",
        backfillStatus: "inProgress",
      },
      {
        did: "did:plc:example789",
        handle: "carol.bsky.social",
        isAdmin: false,
        registeredAt: "2024-01-01T00:00:00.000Z",
        backfillStatus: "error",
      },
    ],
    total: 3,
  },
};

export const Empty: Story = {
  args: {
    serverMembers: [],
  },
};

export const Loading: Story = {
  args: {
    serverMembers: [],
    isLoading: true,
  },
};

export const LoadingMore: Story = {
  args: {
    serverMembers: [
      {
        did: "did:plc:example123",
        handle: "alice.bsky.social",
        displayName: "Alice",
        isAdmin: true,
        registeredAt: "2024-01-03T00:00:00.000Z",
        backfillStatus: "completed",
      },
    ],
    isFetchingNextPage: true,
  },
};

export const Banned: Story = {
  args: {
    tab: "banned",
    serverMembers: [],
    bannedAccounts: [
      {
        did: "did:plc:example999",
        handle: "mallory.bsky.social",
        displayName: "Mallory",
      },
    ],
  },
};
