import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrackedActorsPage } from "./tracked-actors-page";

const meta = {
  component: TrackedActorsPage,
  args: {
    actors: [
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
        subscriberFollowersCount: 3,
      },
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        subscriberFollowersCount: 1,
      },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
        subscriberFollowersCount: 0,
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TrackedActorsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
