import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerInfo } from "./server-info";

const meta = {
  component: ServerInfo,
  args: {
    registeredCount: "3",
    trackedCount: 128,
    serviceDid: "did:web:alpha.subsco.me#bsky_appview",
  },
} satisfies Meta<typeof ServerInfo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    registeredCount: undefined,
    trackedCount: undefined,
    serviceDid: undefined,
  },
};
