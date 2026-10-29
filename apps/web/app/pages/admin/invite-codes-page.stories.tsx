import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodesPage } from "./invite-codes-page";

const meta = {
  component: InviteCodesPage,
} satisfies Meta<typeof InviteCodesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    codes: [
      {
        code: "abc-123-def",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  },
};
