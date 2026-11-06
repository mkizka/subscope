import type { Meta, StoryObj } from "@storybook/react-vite";

import { FollowListPage } from "./follow-list-page";

const meta = {
  component: FollowListPage,
  args: { handle: "alice.bsky.social", kind: "follows" },
  parameters: {
    path: "/alice.bsky.social/follows",
    layout: "fullscreen",
  },
} satisfies Meta<typeof FollowListPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const FollowsEmpty: StoryObj<typeof meta> = {
  args: { handle: "dave.bsky.social" },
};

export const FollowersEmpty: StoryObj<typeof meta> = {
  args: { handle: "dave.bsky.social", kind: "followers" },
};
