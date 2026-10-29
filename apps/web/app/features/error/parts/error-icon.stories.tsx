import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorIcon } from "./error-icon";

const meta = {
  component: ErrorIcon,
  args: {},
} satisfies Meta<typeof ErrorIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotFound: Story = {
  args: {
    status: 404,
  },
};
