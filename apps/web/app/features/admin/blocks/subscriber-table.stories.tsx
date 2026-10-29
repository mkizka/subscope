import type { Meta, StoryObj } from "@storybook/react-vite";

import { SubscriberTable } from "./subscriber-table";

const meta = {
  component: SubscriberTable,
} satisfies Meta<typeof SubscriberTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subscribers: [
      {
        did: "did:plc:example123",
        handle: "alice.bsky.social",
        displayName: "Alice",
        avatar: "https://placehold.co/32",
        isAdmin: true,
      },
      {
        did: "did:plc:example456",
        handle: "bob.bsky.social",
        displayName: "Bob",
        isAdmin: false,
      },
      {
        did: "did:plc:example789",
        handle: "carol.bsky.social",
        isAdmin: false,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    subscribers: [],
  },
};

export const Loading: Story = {
  args: {
    subscribers: [],
    isLoading: true,
  },
};

export const LoadingMore: Story = {
  args: {
    subscribers: [
      {
        did: "did:plc:example123",
        handle: "alice.bsky.social",
        displayName: "Alice",
        isAdmin: true,
      },
    ],
    isFetchingNextPage: true,
  },
};
