import type { Meta, StoryObj } from "@storybook/react-vite";

import { SetupContent } from "./setup-content";

const meta = {
  component: SetupContent,
  args: {},
} satisfies Meta<typeof SetupContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
