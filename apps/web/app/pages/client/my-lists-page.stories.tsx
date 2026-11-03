import type { Meta, StoryObj } from "@storybook/react-vite";

import { MyListsPage } from "./my-lists-page";

const meta = {
  component: MyListsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MyListsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
