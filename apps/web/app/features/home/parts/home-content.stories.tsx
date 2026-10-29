import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomeContent } from "./home-content";

const meta = {
  component: HomeContent,
  args: {},
} satisfies Meta<typeof HomeContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
