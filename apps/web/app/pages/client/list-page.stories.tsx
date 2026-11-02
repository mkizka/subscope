import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListPage } from "./list-page";

const meta = {
  component: ListPage,
  args: { handle: "alice.bsky.social", rkey: "1" },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ListPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
