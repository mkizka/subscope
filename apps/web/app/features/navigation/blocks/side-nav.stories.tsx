import type { Meta, StoryObj } from "@storybook/react-vite";

import { SideNav } from "./side-nav";

const meta = {
  component: SideNav,
  args: {
    did: "did:plc:example",
    handle: "alice.bsky.social",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SideNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
