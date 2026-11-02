import type { Meta, StoryObj } from "@storybook/react-vite";

import { RegisteredAccountsPage } from "./registered-accounts-page";

const meta = {
  component: RegisteredAccountsPage,
  args: {
    registeredAccounts: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        description: "Blueskyを使っています。",
        isAdmin: true,
      },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
      },
    ],
    hasMore: false,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RegisteredAccountsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
