import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodeForm } from "./invite-code-form";

const meta = {
  title: "features/Register/InviteCodeForm",
  component: InviteCodeForm,
  args: {
    isLoggedIn: true,
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
} satisfies Meta<typeof InviteCodeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotLoggedIn: Story = {
  args: {
    isLoggedIn: false,
  },
};

export const ActiveSubmit: Story = {
  args: {
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
    error: "招待コードが無効または期限切れです",
  },
};

export const WithValidationError: Story = {
  args: {
    fields: {
      inviteCode: {
        id: "inviteCode",
        errors: ["招待コードを入力してください"],
      },
    },
  },
};
