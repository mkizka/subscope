import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SubscribersPresentation } from "./presentation";

const dummyDid = "did:plc:xxxxxxxxxxxxxxxxxxxxxx";

const meta = {
  title: "Features/Subscribers",
  component: SubscribersPresentation,
  args: {
    subscribers: [
      {
        did: dummyDid,
        handle: "alice.test",
        displayName: "Alice",
        avatar: "https://picsum.photos/seed/alice/150",
      },
      {
        did: dummyDid,
        handle: "bob.test",
        displayName: "Bob",
        avatar: "https://picsum.photos/seed/bob/150",
      },
      {
        did: dummyDid,
        handle: "charlie.test",
        displayName: "Charlie",
        avatar: "https://picsum.photos/seed/charlie/150",
      },
    ],
    error: null,
    reload: fn(),
    loadMore: fn(),
    hasMore: false,
    isFetching: false,
  },
} satisfies Meta<typeof SubscribersPresentation>;

export default meta;
type Story = StoryObj<typeof SubscribersPresentation>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    subscribers: [],
  },
};

export const Loading: Story = {
  args: {
    isFetching: true,
    hasMore: true,
  },
};

export const WithError: Story = {
  args: {
    subscribers: undefined,
    error: new Error("Failed to load data"),
  },
};

export const HasMore: Story = {
  args: {
    hasMore: true,
  },
};

export const WithLongNames: Story = {
  args: {
    subscribers: [
      {
        did: dummyDid,
        handle: "verylooooooooooooooooooooooooooooooooooooong.test",
        displayName: "Very Looooooooooooooooooooooooooooooooooooong Name",
        avatar: "https://picsum.photos/150",
      },
    ],
  },
};

export const NoAvatars: Story = {
  args: {
    subscribers: [
      {
        did: dummyDid,
        handle: "alice.test",
        displayName: "Alice",
      },
      {
        did: dummyDid,
        handle: "bob.test",
        displayName: "Bob",
      },
      {
        did: dummyDid,
        handle: "charlie.test",
        displayName: "Charlie",
      },
    ],
  },
};
