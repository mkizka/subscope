import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, bob, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as followListLoader } from "@/app/routes/api.profile.$handle.$kind";

import { FollowListPage } from "./follow-list-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof followListLoader>>(
      ["follow-list", alice.handle, "follows", false],
      {
        subject: alice,
        accounts: [
          { ...bob, description: "Bobの自己紹介" },
          { did: "did:plc:carol", handle: "handle.invalid" },
        ],
      },
    );
    for (const kind of ["follows", "followers"] as const) {
      queryClient.setQueryData<Data<typeof followListLoader>>(
        ["follow-list", "dave.bsky.social", kind, false],
        {
          subject: {
            did: "did:plc:dave",
            handle: "dave.bsky.social",
            displayName: "Dave",
          },
          accounts: [],
        },
      );
    }
  },
  component: FollowListPage,
  args: { handle: "alice.bsky.social", kind: "follows" },
  parameters: {
    path: "/alice.bsky.social/follows",
    layout: "fullscreen",
  },
} satisfies Meta<typeof FollowListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FollowsEmpty: Story = {
  args: { handle: "dave.bsky.social" },
};

export const FollowersEmpty: Story = {
  args: { handle: "dave.bsky.social", kind: "followers" },
};
