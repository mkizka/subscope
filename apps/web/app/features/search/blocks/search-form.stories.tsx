import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchForm } from "./search-form";

const meta = {
  component: SearchForm,
  args: {
    formProps: {},
    inputProps: { name: "q" },
    tab: "accounts",
    loading: false,
    history: [],
    onRemoveHistory: () => {},
    onClearHistory: () => {},
  },
} satisfies Meta<typeof SearchForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const WithHistory: Story = {
  args: { history: ["Bluesky", "#atproto", "alice"] },
  play: ({ canvasElement }) => {
    canvasElement.querySelector("input")?.focus();
  },
};
