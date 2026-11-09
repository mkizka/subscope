import type { Meta, StoryObj } from "@storybook/react-vite";

import { MobileHeader } from "./mobile-header";

const meta = {
  component: MobileHeader,
  args: {
    profileId: "alice.bsky.social",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MobileHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Admin: Story = {
  args: {
    isAdmin: true,
  },
};
