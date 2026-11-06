import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreadPage } from "./thread-page";

const meta = {
  component: ThreadPage,
  parameters: {
    path: "/alice.bsky.social/post/selected",
    layout: "fullscreen",
  },
  args: {
    handle: "alice.bsky.social",
    rkey: "selected",
  },
} satisfies Meta<typeof ThreadPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
