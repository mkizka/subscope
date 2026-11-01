import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginForm } from "./login-form";

const meta = {
  component: LoginForm,
  args: {
    formProps: {},
    inputProps: {
      id: "identifier",
      name: "identifier",
    },
  },
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "有効なハンドルを入力してください",
  },
};
