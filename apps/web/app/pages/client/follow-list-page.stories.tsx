import type { Meta, StoryObj } from "@storybook/react-vite";

import { FollowListPage } from "./follow-list-page";

const meta = {
  component: FollowListPage,
  args: {
    title: "フォロー",
    subject: {
      did: "did:plc:alice",
      handle: "alice.bsky.social",
      displayName: "Alice",
    },
    actors: [
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
        description: "Bobの自己紹介",
      },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FollowListPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
