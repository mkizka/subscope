import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfileHeader } from "./profile-header";

const meta = {
  component: ProfileHeader,
  args: {
    handle: "alice.bsky.social",
    displayName: "Alice",
    description: "Blueskyを使っています。",
    followsCount: 120,
    followersCount: 345,
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
