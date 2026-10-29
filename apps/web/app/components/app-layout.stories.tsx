import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppLayout } from "./app-layout";

const meta = {
  component: AppLayout,
  args: {
    children: <p>コンテンツ</p>,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
