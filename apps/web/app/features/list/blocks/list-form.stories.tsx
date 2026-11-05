import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListForm } from "./list-form";

const meta = {
  component: ListForm,
  args: {
    summary: "リストを作成",
    submitLabel: "作成する",
  },
} satisfies Meta<typeof ListForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Edit: Story = {
  args: {
    summary: "リストを編集",
    submitLabel: "更新する",
    name: "友達",
    description: "よく話す人たち",
  },
};
