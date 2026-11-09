import type { Meta, StoryObj } from "@storybook/react-vite";

import { AdminNavMenu } from "./nav-menu";

const meta = {
  component: AdminNavMenu,
} satisfies Meta<typeof AdminNavMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
