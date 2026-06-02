import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPage } from "./login";

const meta = {
  title: "pages/login",
  component: LoginPage,
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
} satisfies Meta<typeof LoginPage>;

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
