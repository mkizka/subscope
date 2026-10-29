import type { Meta, StoryObj } from "@storybook/react-vite";

import { TimelinePage } from "./timeline";

const meta = {
  component: TimelinePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelinePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    atprotoProxy: "did:web:example.com",
    posts: [],
  },
};
