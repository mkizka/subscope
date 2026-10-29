import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostForm } from "./post-form";

const meta = {
  title: "features/Timeline/PostForm",
  component: PostForm,
} satisfies Meta<typeof PostForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isSubmitting: false,
    onSubmit: () => {},
  },
};
