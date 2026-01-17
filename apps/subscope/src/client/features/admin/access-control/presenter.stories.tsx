import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { AccessControlPresenter } from "./presenter";

const meta = {
  title: "Features/Admin/AccessControl",
  component: AccessControlPresenter,
  args: {
    isLoading: false,
    error: null,
    status: "authorized",
    isRegistering: false,
    onRegister: fn(),
    children: <div>管理画面のコンテンツ</div>,
  },
} satisfies Meta<typeof AccessControlPresenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    error: { message: "アクセス権限の確認に失敗しました" },
  },
};

export const Authorized: Story = {};

export const NeedsSetup: Story = {
  args: {
    status: "needsSetup",
  },
};

export const Registering: Story = {
  args: {
    status: "needsSetup",
    isRegistering: true,
  },
};

export const Unauthorized: Story = {
  args: {
    status: "unauthorized",
  },
};
