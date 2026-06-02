import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "ui/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
    },
    disabled: {
      control: "boolean",
    },
    children: {
      control: "text",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
