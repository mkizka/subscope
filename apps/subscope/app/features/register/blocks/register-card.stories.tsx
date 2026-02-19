import type { Meta, StoryObj } from "@storybook/react-vite";

import { RegisterCard } from "./register-card";

const meta = {
  title: "features/Register/RegisterCard",
  component: RegisterCard,
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
} satisfies Meta<typeof RegisterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotLoggedIn: Story = {};

export const LoggedIn: Story = {
  args: {
    isLoggedIn: true,
  },
};

export const ActiveSubmit: Story = {
  args: {
    isLoggedIn: true,
    activeSubmit: true,
    inputProps: {
      id: "inviteCode",
      name: "inviteCode",
      defaultValue: "subsco-me-abcde",
    },
  },
};

export const WithError: Story = {
  args: {
    isLoggedIn: true,
    error: "招待コードが無効または期限切れです",
  },
};

export const WithValidationError: Story = {
  args: {
    isLoggedIn: true,
    fields: {
      inviteCode: {
        id: "inviteCode",
        errors: ["招待コードを入力してください"],
      },
    },
  },
};
