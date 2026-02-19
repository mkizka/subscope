import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPresenter } from "./presenter";

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
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
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
