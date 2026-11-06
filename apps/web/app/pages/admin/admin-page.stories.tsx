import type { Meta, StoryObj } from "@storybook/react-vite";

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
  args: {
    children: <RegisteredAccountListContainer />,
  },
};
