import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationsPage } from "./notifications-page";

const meta = {
  component: NotificationsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotificationsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
