import type { Meta, StoryObj } from "@storybook/react-vite";

import { RegisterPage } from "./register";

const meta = {
  title: "pages/register",
  component: RegisterPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isLoggedIn: false,
    formProps: {},
    inputProps: {
      id: "inviteCode",
      name: "inviteCode",
    },
    fields: {
      inviteCode: {
        id: "inviteCode",
      },
    },
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
