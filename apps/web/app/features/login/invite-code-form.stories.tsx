import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodeForm } from "./invite-code-form";

const meta = {
  component: InviteCodeForm,
  args: {
    formProps: {},
    inputProps: {
      id: "inviteCode",
      name: "inviteCode",
    },
    loading: false,
  },
} satisfies Meta<typeof InviteCodeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "招待コードが無効または期限切れです",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
