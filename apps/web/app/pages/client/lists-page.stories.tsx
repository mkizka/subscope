import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListsPage } from "./lists-page";

const meta = {
  component: ListsPage,
  args: { handle: "alice.bsky.social" },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ListsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
