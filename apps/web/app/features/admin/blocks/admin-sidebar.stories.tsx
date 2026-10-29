import type { Meta, StoryObj } from "@storybook/react-vite";
import { TicketIcon, UsersIcon } from "lucide-react";

import { SidebarProvider } from "@/app/components/ui/sidebar";

import { AdminSidebar } from "./admin-sidebar";

const meta = {
  component: AdminSidebar,
  args: {
    menuItems: [
      { title: "招待コード", icon: TicketIcon, href: "/admin" },
      { title: "登録アカウント", icon: UsersIcon, href: "/admin/subscribers" },
    ],
    currentPath: "/admin",
  },
  decorators: (Story) => (
    <SidebarProvider>
      <Story />
    </SidebarProvider>
  ),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
