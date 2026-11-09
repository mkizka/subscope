import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { BackfillBanner } from "./backfill-banner";

const meta = {
  component: BackfillBanner,
  args: { status: "inProgress", onRefresh: () => {} },
} satisfies Meta<typeof BackfillBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  name: "backfillBanner-s1: 自分の同期中は、「過去の投稿を同期しています」の帯を出す",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(/過去の投稿を同期しています/),
    ).toBeVisible();
  },
};

export const Failed: Story = { args: { status: "error" } };

export const Done: Story = { args: { status: "done" } };
