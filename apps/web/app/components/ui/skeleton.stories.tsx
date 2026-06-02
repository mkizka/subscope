import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./skeleton";

const meta = {
  title: "ui/Skeleton",
  component: Skeleton,
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    </div>
  ),
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
