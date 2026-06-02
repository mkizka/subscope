import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "ui/Sheet",
  component: Sheet,
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open Sheet
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a sheet description. You can put any content here.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6">
          <p>Sheet content goes here.</p>
        </div>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
