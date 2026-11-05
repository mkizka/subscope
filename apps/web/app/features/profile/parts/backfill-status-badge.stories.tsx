import type { Meta, StoryObj } from "@storybook/react-vite";

import { BackfillStatusBadge } from "./backfill-status-badge";

const meta = {
  component: BackfillStatusBadge,
  args: { status: "inProgress" },
} satisfies Meta<typeof BackfillStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const Completed: Story = { args: { status: "completed" } };

export const Error: Story = { args: { status: "error" } };
