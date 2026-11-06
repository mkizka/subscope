import type { $OutputBody as RegisteredAccountsResponse } from "@repo/client/me/subsco/admin/listRegisteredAccounts";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { setInfiniteQueryData } from "@/.storybook/query-client";
import { RegisteredAccountListContainer } from "@/app/features/admin/blocks/registered-account-list-container";

import { AdminPage } from "./admin-page";

const meta = {
  component: AdminPage,
  parameters: {
    path: "/admin/registered-accounts",
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegisteredAccounts: Story = {
  beforeEach: () => {
    setInfiniteQueryData(["registeredAccounts"], {
      registeredAccounts: [
        {
          profile: {
            did: "did:plc:alice",
            handle: "alice.bsky.social",
            displayName: "Alice",
          },
          isAdmin: true,
          registeredAt: "2024-01-01T00:00:00.000Z",
          backfillStatus: "completed",
        },
        {
          profile: {
            did: "did:plc:bob",
            handle: "bob.bsky.social",
            displayName: "Bob",
          },
          isAdmin: false,
          registeredAt: "2024-01-02T00:00:00.000Z",
          backfillStatus: "inProgress",
        },
      ],
      total: 2,
    } satisfies RegisteredAccountsResponse);
  },
  args: {
    children: <RegisteredAccountListContainer />,
  },
};
