import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginForm } from "./login-form";

const meta = {
  title: "features/Login/LoginForm",
  component: LoginForm,
  args: {
    formProps: {},
    inputProps: {
      id: "identifier",
      name: "identifier",
    },
    fields: {
      identifier: {
        id: "identifier",
      },
    },
  },
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    fields: {
      identifier: {
        id: "identifier",
        errors: ["有効なハンドルを入力してください"],
      },
    },
  },
};
