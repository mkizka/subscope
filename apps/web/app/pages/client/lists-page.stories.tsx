import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListsPage } from "./lists-page";

const meta = {
  component: ListsPage,
  args: {
    lists: [
      { rkey: "1", name: "友達", description: "よく話す人たち" },
      { rkey: "2", name: "ニュース" },
    ],
    isSelf: true,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ListsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
