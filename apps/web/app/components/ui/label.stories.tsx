import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "./label";

const meta = {
  title: "ui/Label",
  component: Label,
  args: {
    children: "Label",
  },
  argTypes: {
    children: {
      control: "text",
    },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
