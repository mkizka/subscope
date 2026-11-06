import type { Meta, StoryObj } from "@storybook/react-vite";

import { FollowButton } from "@/app/features/profile/parts/follow-button";

import { ProfileHeader } from "./profile-header";

const meta = {
  component: ProfileHeader,
  args: {
    handle: "alice.bsky.social",
    displayName: "Alice",
    description: "Blueskyを使っています。",
    followsCount: 120,
    followersCount: 345,
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const WithImages: StoryObj<typeof meta> = {
  args: {
    avatarUrl: "https://placehold.co/160",
    bannerUrl: "https://placehold.co/600x200",
  },
};

export const NotFollowing: StoryObj<typeof meta> = {
  args: {
    avatarUrl: "https://placehold.co/160",
    bannerUrl: "https://placehold.co/600x200",
    action: <FollowButton following={false} onClick={() => {}} />,
  },
};

export const Following: StoryObj<typeof meta> = {
  args: {
    avatarUrl: "https://placehold.co/160",
    bannerUrl: "https://placehold.co/600x200",
    action: <FollowButton following onClick={() => {}} />,
  },
};

export const WithLinks: StoryObj<typeof meta> = {
  args: {
    links: [
      {
        uri: "at://a/app.bsky.actor.link/1",
        cid: "a",
        url: "https://example.com/blog",
        title: "ブログ",
      },
      {
        uri: "at://a/app.bsky.actor.link/2",
        cid: "b",
        url: "https://github.com/alice",
      },
      {
        uri: "at://a/app.bsky.actor.link/3",
        cid: "c",
        url: "https://example.com/long",
        title:
          "とても長いタイトルのリンクがここに入った場合の表示を確認するためのリンク",
      },
    ],
  },
};

export const FollowedBy: StoryObj<typeof meta> = {
  args: { followedBy: true },
};

export const BackfillInProgress: StoryObj<typeof meta> = {
  args: { backfillStatus: "inProgress" },
};

export const BackfillError: StoryObj<typeof meta> = {
  args: { backfillStatus: "error" },
};

export const Loading: StoryObj<typeof meta> = {
  args: {
    loading: true,
    displayName: undefined,
    description: undefined,
    followsCount: undefined,
    followersCount: undefined,
  },
};
