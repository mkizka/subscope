import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchPage } from "./search-page";

const meta = {
  component: SearchPage,
  args: {
    q: "alice",
    actors: [
      {
        did: "did:plc:alice",
        handle: "alice.bsky.social",
        displayName: "Alice",
        description: "Blueskyを使っています。",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SearchPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const NotFound: StoryObj<typeof meta> = {
  args: { actors: [] },
};

export const Empty: StoryObj<typeof meta> = {
  args: { q: undefined, actors: [] },
};
