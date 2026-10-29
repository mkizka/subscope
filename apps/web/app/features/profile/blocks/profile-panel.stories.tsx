import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfilePanel } from "./profile-panel";

const meta = {
  component: ProfilePanel,
  args: {
    handle: "alice.bsky.social",
    displayName: "Alice",
    description: "Blueskyを使っています。\nよろしくお願いします。",
    followsCount: 120,
    followersCount: 345,
    closeSearch: "",
  },
} satisfies Meta<typeof ProfilePanel>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
