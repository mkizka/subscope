import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPresentation } from "./presentation";

const meta = {
  title: "Features/Login",
  component: LoginPresentation,
} satisfies Meta<typeof LoginPresentation>;

export default meta;
type Story = StoryObj<typeof LoginPresentation>;

export const Default: Story = {};

export const WithFormError: Story = {
  args: {
    lastResult: {
      status: "error",
      initialValue: {},
      error: {
        "": ["認証に失敗しました。もう一度お試しください。"],
      },
    },
  },
};

export const WithFieldError: Story = {
  args: {
    lastResult: {
      status: "error",
      initialValue: {},
      error: {
        identifier: ["ハンドルは必須です"],
      },
    },
  },
};

export const WithPreviousValue: Story = {
  args: {
    lastResult: {
      status: "error",
      initialValue: {
        identifier: "example.bsky.social",
      },
      error: {
        "": ["認証に失敗しました。もう一度お試しください。"],
      },
    },
  },
};
