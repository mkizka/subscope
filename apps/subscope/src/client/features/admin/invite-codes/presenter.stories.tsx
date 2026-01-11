import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { InviteCodesPresenter } from "./presenter";

const meta = {
  title: "Features/Admin/InviteCodes",
  component: InviteCodesPresenter,
  args: {
    inviteCodes: [
      {
        id: "1",
        code: "subscope-abc12",
        createdAt: "2024-01-01",
        usedBy: null,
        status: "未使用",
      },
      {
        id: "2",
        code: "subscope-def34",
        createdAt: "2024-01-02",
        usedBy: "alice.test",
        status: "使用済み",
      },
      {
        id: "3",
        code: "subscope-ghi56",
        createdAt: "2024-01-03",
        usedBy: "bob.test",
        status: "使用済み",
      },
    ],
    copiedCode: null,
    isLoading: false,
    error: null,
    onGenerateInviteCode: fn(),
    onCopyToClipboard: fn(),
  },
} satisfies Meta<typeof InviteCodesPresenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    inviteCodes: [],
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    error: { message: "Failed to load data" },
  },
};

export const Copied: Story = {
  args: {
    copiedCode: "subscope-abc12",
  },
};
