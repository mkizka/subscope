import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarSearch } from "./sidebar-search";

const meta = {
  component: SidebarSearch,
} satisfies Meta<typeof SidebarSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
