import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThreeColumnLayout } from "./three-column-layout";

const meta = {
  component: ThreeColumnLayout,
  args: {
    children: <p className="p-4">コンテンツ</p>,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ThreeColumnLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
