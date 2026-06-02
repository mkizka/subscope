import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "ui/Card",
  component: Card,
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
