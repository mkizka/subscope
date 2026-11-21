import type { Meta, StoryObj } from "@storybook/react-vite";

import { IncompleteNotice } from "./incomplete-notice";

const meta = {
  component: IncompleteNotice,
} satisfies Meta<typeof IncompleteNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tracked: Story = {
  args: { tracked: true },
};

export const Untracked: Story = {
  args: { tracked: false },
};
