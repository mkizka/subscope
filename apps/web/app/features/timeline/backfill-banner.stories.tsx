import type { Meta, StoryObj } from "@storybook/react-vite";

import { BackfillBanner } from "./backfill-banner";

const meta = {
  component: BackfillBanner,
  args: { status: "inProgress", onRefresh: () => {} },
} satisfies Meta<typeof BackfillBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const Failed: Story = { args: { status: "error" } };

export const Done: Story = { args: { status: "done" } };
