import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarProvider } from "@/app/components/ui/sidebar";

import { AdminHeader } from "./admin-header";

const meta = {
  component: AdminHeader,
  args: {},
  decorators: (Story) => (
    <SidebarProvider>
      <Story />
    </SidebarProvider>
  ),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
