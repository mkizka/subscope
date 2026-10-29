import type { Meta, StoryObj } from "@storybook/react-vite";

import { RegisterPage } from "./register-page";

const meta = {
  component: RegisterPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isLoggedIn: false,
  },
} satisfies Meta<typeof RegisterPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotLoggedIn: Story = {};

export const LoggedIn: Story = {
  args: {
    isLoggedIn: true,
  },
};
