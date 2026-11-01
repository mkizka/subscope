import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Dialog } from "./dialog";

const meta = {
  component: Dialog,
  args: {
    open: true,
    title: "投稿を削除しますか？",
    children: <p className="text-body">この操作は取り消せません。</p>,
    actions: (
      <>
        <Button variant="secondary">キャンセル</Button>
        <Button variant="danger">削除</Button>
      </>
    ),
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
