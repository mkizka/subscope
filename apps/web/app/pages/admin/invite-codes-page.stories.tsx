import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteCodesPage } from "./invite-codes-page";

const meta = {
  component: InviteCodesPage,
} satisfies Meta<typeof InviteCodesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
