import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListLinks } from "./list-links";

const meta = {
  component: ListLinks,
  args: {
    handle: "alice.bsky.social",
    lists: [
      { rkey: "1", name: "友達", description: "よく話す人たち" },
      { rkey: "2", name: "ニュース" },
    ],
  },
} satisfies Meta<typeof ListLinks>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { lists: [] },
};
