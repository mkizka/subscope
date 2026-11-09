import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarSearch } from "./sidebar-search";

const meta = {
  component: SidebarSearch,
} satisfies Meta<typeof SidebarSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inputProps: {},
    suggestions: [],
    onSelect: () => {},
    history: [],
    onRemoveHistory: () => {},
    onClearHistory: () => {},
  },
};

export const WithSuggestions: Story = {
  args: {
    inputProps: { value: "ali" },
    suggestions: [
      { did: "did:plc:alice", handle: "alice.test", displayName: "Alice" },
      { did: "did:plc:alina", handle: "alina.test" },
    ],
    onSelect: () => {},
    history: [],
    onRemoveHistory: () => {},
    onClearHistory: () => {},
  },
};
