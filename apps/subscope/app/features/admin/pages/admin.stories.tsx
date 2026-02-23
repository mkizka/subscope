import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { InviteCodeTableContainer } from "@/app/features/admin/blocks/invite-code-table-container";

import { AdminLayout } from "./admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta = {
  title: "pages/admin",
  component: AdminLayout,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InviteCode: Story = {
  args: {
    children: <InviteCodeTableContainer />,
  },
};
