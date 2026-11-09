import type { $OutputBody as ServerMembersResponse } from "@repo/client/me/subsco/admin/listServerMembers";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, bob, queryClient } from "@/.storybook/query-client";
import { ServerMemberListContainer } from "@/app/features/admin/server-member-list-container";

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

export const ServerMembers: Story = {
  beforeEach: () => {
    queryClient.setQueryData(["serverMembers"], {
      pages: [
        {
          serverMembers: [
            {
              profile: alice,
              isAdmin: true,
              registeredAt: "2024-01-01T00:00:00.000Z",
              backfillStatus: "completed",
            },
            {
              profile: bob,
              isAdmin: false,
              registeredAt: "2024-01-02T00:00:00.000Z",
              backfillStatus: "inProgress",
            },
          ],
          total: 2,
        } satisfies ServerMembersResponse,
      ],
      pageParams: [undefined],
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
};
