import type { Meta, StoryObj } from "@storybook/react-vite";

import { PushPrompt } from "./push-prompt";

const meta = {
  component: PushPrompt,
  args: { enabled: false, isPending: false, onEnable: () => {} },
} satisfies Meta<typeof PushPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = { args: { isPending: true } };

export const Enabled: Story = { args: { enabled: true } };
