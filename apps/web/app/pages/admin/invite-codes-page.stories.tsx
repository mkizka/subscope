import type { Meta, StoryObj } from "@storybook/react-vite";

import { infinite, queryClient } from "@/.storybook/query-client";
import type { loader as inviteCodesLoader } from "@/app/routes/admin.api.invite-codes";

import { AdminPage } from "./admin-page";
import { InviteCodesPage } from "./invite-codes-page";

const meta = {
  component: InviteCodesPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AdminPage>
        <Story />
      </AdminPage>
    ),
  ],
} satisfies Meta<typeof InviteCodesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["inviteCodes"],
      infinite<typeof inviteCodesLoader>({
        codes: [
          {
            code: "abc-123-def",
            expiresAt: "2099-12-31T23:59:59.000Z",
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
  },
};
