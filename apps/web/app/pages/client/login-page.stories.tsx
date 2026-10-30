import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPage } from "./login-page";

const meta = {
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    step: "login",
  },
} satisfies Meta<typeof LoginPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Setup: Story = {
  args: {
    step: "setup",
  },
};

export const InviteCode: Story = {
  args: {
    step: "inviteCode",
  },
};
