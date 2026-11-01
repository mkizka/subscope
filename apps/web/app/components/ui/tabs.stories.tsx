import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs } from "./tabs";

const meta = {
  component: Tabs,
  args: {
    tabs: [
      { to: "/posts", label: "投稿", selected: true },
      { to: "/replies", label: "返信", selected: false },
      { to: "/likes", label: "いいね", selected: false },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
