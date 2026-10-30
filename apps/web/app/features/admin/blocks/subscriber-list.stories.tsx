import type { Meta, StoryObj } from "@storybook/react-vite";

import { SubscriberList } from "./subscriber-list";

const meta = {
  component: SubscriberList,
} satisfies Meta<typeof SubscriberList>;

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
        subscribedAt: "2024-01-03T00:00:00.000Z",
      },
      {
        did: "did:plc:example456",
        handle: "bob.bsky.social",
        displayName: "Bob",
        isAdmin: false,
        subscribedAt: "2024-01-02T00:00:00.000Z",
      },
      {
        did: "did:plc:example789",
        handle: "carol.bsky.social",
        isAdmin: false,
        subscribedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    total: 3,
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
        subscribedAt: "2024-01-03T00:00:00.000Z",
      },
    ],
    isFetchingNextPage: true,
  },
};
