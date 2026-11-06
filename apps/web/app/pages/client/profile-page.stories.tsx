import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfilePage } from "./profile-page";

const meta = {
  component: ProfilePage,
  args: {
    handle: "alice.bsky.social",
  },
  parameters: {
    path: "/alice.bsky.social",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
