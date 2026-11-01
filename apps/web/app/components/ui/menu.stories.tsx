import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ellipsis } from "lucide-react";

import { Menu, menuItemClass } from "./menu";

const meta = {
  component: Menu,
  args: {
    label: "メニュー",
    trigger: <Ellipsis className="size-5" />,
    children: (
      <>
        <button type="button" className={menuItemClass}>
          リンクをコピー
        </button>
        <button type="button" className={menuItemClass}>
          削除
        </button>
      </>
    ),
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bottom: Story = {};

export const Top: Story = {
  args: { placement: "top" },
};
