import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerInfo } from "./server-info";

const meta = {
  component: ServerInfo,
  args: {
    operators: [
      { did: "did:plc:alice", handle: "alice.test", displayName: "Alice" },
    ],
    serviceDid: "did:web:alpha.subsco.me#bsky_appview",
  },
} satisfies Meta<typeof ServerInfo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    operators: undefined,
    serviceDid: undefined,
  },
};
