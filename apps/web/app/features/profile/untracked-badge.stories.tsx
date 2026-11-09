import type { Meta, StoryObj } from "@storybook/react-vite";

import { UntrackedBadge } from "./untracked-badge";

const meta = {
  component: UntrackedBadge,
} satisfies Meta<typeof UntrackedBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
