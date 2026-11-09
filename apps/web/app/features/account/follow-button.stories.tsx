import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { FollowButton } from "./follow-button";

const meta = {
  component: FollowButton,
  args: { following: false, onClick: fn() },
} satisfies Meta<typeof FollowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFollowing: Story = {};

export const Following: Story = { args: { following: true } };

export const Busy: Story = { args: { busy: true } };
