import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerAbout } from "./server-about";

const meta = {
  component: ServerAbout,
} satisfies Meta<typeof ServerAbout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
