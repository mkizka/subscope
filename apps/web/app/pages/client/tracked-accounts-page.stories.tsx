import type { Meta, StoryObj } from "@storybook/react-vite";

import { TrackedAccountsPage } from "./tracked-accounts-page";

const meta = {
  component: TrackedAccountsPage,
  args: {
    total: 3,
    actors: [
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
        registeredFollowersCount: 3,
      },
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        registeredFollowersCount: 1,
      },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
        registeredFollowersCount: 0,
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TrackedAccountsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
