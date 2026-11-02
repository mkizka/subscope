import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchPage } from "./search-page";

const meta = {
  component: SearchPage,
  args: {
    q: "alice",
    tab: "actors",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SearchPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const NotFound: StoryObj<typeof meta> = {
  args: { q: "nobody" },
};

export const Posts: StoryObj<typeof meta> = {
  args: {
    tab: "posts",
  },
};

export const PostsNotFound: StoryObj<typeof meta> = {
  args: { q: "nobody", tab: "posts" },
};

export const Empty: StoryObj<typeof meta> = {
  args: { q: undefined },
};
