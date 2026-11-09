import type { Meta, StoryObj } from "@storybook/react-vite";

import { UntrackedNotice } from "./untracked-notice";

const meta = {
  component: UntrackedNotice,
} satisfies Meta<typeof UntrackedNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
