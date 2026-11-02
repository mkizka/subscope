import type { Meta, StoryObj } from "@storybook/react-vite";

import { FollowListPage } from "./follow-list-page";

const meta = {
  component: FollowListPage,
  args: { handle: "alice.bsky.social", kind: "follows" },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FollowListPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
