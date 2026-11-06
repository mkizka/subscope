import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useEffect, useRef } from "react";

import { ListForm } from "./list-form";

function OpenListForm(args: ComponentProps<typeof ListForm>) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.show(), []);
  return <ListForm {...args} ref={ref} />;
}

const meta = {
  component: ListForm,
  args: {
    ref: { current: null },
    title: "新しいリスト",
    submitLabel: "作成する",
  },
  render: (args) => <OpenListForm {...args} />,
} satisfies Meta<typeof ListForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Edit: Story = {
  args: {
    title: "リストを編集",
    submitLabel: "保存する",
    name: "友達",
    description: "よく話す人たち",
  },
};
