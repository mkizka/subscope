import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPresenter } from "./login";

const meta = {
  title: "features/Login",
  component: LoginPresenter,
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
} satisfies Meta<typeof LoginPresenter>;

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
