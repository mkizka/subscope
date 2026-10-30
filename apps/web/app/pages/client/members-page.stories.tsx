import type { Meta, StoryObj } from "@storybook/react-vite";

import { MembersPage } from "./members-page";

const meta = {
  component: MembersPage,
  args: {
    members: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        isAdmin: true,
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
} satisfies Meta<typeof MembersPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
