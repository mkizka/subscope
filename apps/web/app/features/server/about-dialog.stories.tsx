import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import { AboutDialog } from "./about-dialog";

function OpenOnMount({ open }: { open: () => void }) {
  useEffect(open, [open]);

  return null;
}

const meta = {
  component: AboutDialog,
  args: {
    operator: { handle: "alice.example.com", displayName: "Alice" },
    children: (open) => <OpenOnMount open={open} />,
  },
} satisfies Meta<typeof AboutDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
