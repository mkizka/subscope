import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerPage } from "./server-page";

const meta = {
  component: ServerPage,
  parameters: {
    path: "/server",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ServerPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
