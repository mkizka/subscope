import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./field";
import { Input } from "./input";

const meta = {
  title: "ui/Field",
  component: Field,
  args: {
    orientation: "vertical",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
  render: (args) => (
    <Field {...args}>
      <FieldLabel>Label</FieldLabel>
      <FieldContent>
        <Input placeholder="Placeholder" />
        <FieldDescription>This is a description.</FieldDescription>
        <FieldError errors={["This is an error."]} />
      </FieldContent>
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
