import type { Meta, StoryObj } from "@storybook/react-vite";

import { RichText } from "./rich-text";

const meta = {
  component: RichText,
  args: { text: "こんにちは、世界" },
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithLinks: Story = {
  args: {
    text: "こんにちは @alice.bsky.social https://example.com を見て",
    links: [
      { byteStart: 16, byteEnd: 34, did: "did:plc:alice" },
      { byteStart: 35, byteEnd: 54, uri: "https://example.com" },
    ],
  },
};
