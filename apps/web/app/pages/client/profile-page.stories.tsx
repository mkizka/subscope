import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/blocks/timeline-feed.stories";
import type { loader as profileLoader } from "@/app/routes/api.profile.$handle";

import { ProfilePage } from "./profile-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof profileLoader>>(
      ["profile", alice.handle, ""],
      {
        profile: {
          ...alice,
          description: "Blueskyを使っています。",
          followsCount: 120,
          followersCount: 345,
        },
        isSelf: false,
        posts: TimelineFeedStories.args.posts,
        tab: "posts",
      },
    );
  },
  component: ProfilePage,
  args: {
    handle: "alice.bsky.social",
  },
  parameters: {
    path: "/alice.bsky.social",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPosts: Story = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof profileLoader>>(
      ["profile", alice.handle, ""],
      {
        profile: {
          did: alice.did,
          handle: alice.handle,
          displayName: alice.displayName,
          followsCount: 0,
          followersCount: 0,
        },
        isSelf: false,
        posts: [],
        tab: "posts",
      },
    );
  },
};
