import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodeTable } from "./invite-code-table";

const meta: Meta<typeof InviteCodeTable> = {
  title: "features/Admin/InviteCodeTable",
  component: InviteCodeTable,
};

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
      {
        code: "ghi-456-jkl",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-10T00:00:00.000Z",
        usedAt: "2025-01-15T10:00:00.000Z",
        usedBy: { did: "did:plc:example123", handle: "alice.bsky.social" },
      },
      {
        code: "mno-789-pqr",
        expiresAt: "2020-01-01T00:00:00.000Z",
        createdAt: "2019-06-01T00:00:00.000Z",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    codes: [],
  },
};

export const WithNextPage: Story = {
  args: {
    codes: [
      {
        code: "abc-123-def",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    nextCursor: "cursor-abc123",
  },
};
