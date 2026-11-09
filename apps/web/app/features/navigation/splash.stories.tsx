import type { Meta, StoryObj } from "@storybook/react-vite";

import { Splash } from "./splash";

const meta = {
  component: Splash,
  args: {
    leaving: false,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Splash>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Leaving: Story = {
  args: {
    leaving: true,
  },
};
