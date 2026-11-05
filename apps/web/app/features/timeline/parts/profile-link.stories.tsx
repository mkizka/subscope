import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfileLink } from "./profile-link";

const meta = {
  component: ProfileLink,
  args: { handle: "alice.bsky.social", children: "@alice.bsky.social" },
} satisfies Meta<typeof ProfileLink>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
