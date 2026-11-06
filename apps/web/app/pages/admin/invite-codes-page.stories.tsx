import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Default: Story = {};
