import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ellipsis } from "lucide-react";

import { Button } from "./button";

const meta = {
  component: Button,
  args: { children: "ボタン" },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: <Ellipsis className="size-5" /> },
};

export const Danger: Story = {
  args: { variant: "danger" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
