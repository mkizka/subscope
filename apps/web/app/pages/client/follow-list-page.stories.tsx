import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, infinite, queryClient } from "@/.storybook/query-client";
import type { loader as followListLoader } from "@/app/routes/api.profile.$handle.$kind";

import { FollowListPage } from "./follow-list-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["follow-list", alice.handle, "follows", "all"],
      infinite<typeof followListLoader>({
        subject: alice,
        accounts: [
          { ...bob, description: "Bobの自己紹介" },
          { did: "did:plc:carol", handle: "handle.invalid" },
        ],
      }),
    );
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

const emptyData = (
  handle: string,
  kind: "follows" | "followers",
  filter = "all",
) => {
  queryClient.setQueryData(
    ["follow-list", handle, kind, filter],
    infinite<typeof followListLoader>({
      subject: { did: "did:plc:dave", handle, displayName: "Dave" },
      accounts: [],
    }),
  );
};

export const Loading: Story = {
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["follow-list", alice.handle] });
    queryClient
      .query({
        queryKey: ["follow-list", alice.handle, "follows", "all"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
};

export const FollowersTabs: Story = {
  name: "followList-s3: フォロワー一覧に「すべて」「知り合い」「メンバー」のタブを出し、「メンバー」には人数を添える",
  args: { kind: "followers" },
  parameters: { path: "/alice.bsky.social/followers" },
  beforeEach: () => {
    queryClient.setQueryData(
      ["follow-list", alice.handle, "followers", "all"],
      infinite<typeof followListLoader>({
        subject: alice,
        accounts: [bob],
        registeredCount: 3,
      }),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "すべて" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "知り合い" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "メンバー 3" })).toBeVisible();
  },
};

export const FollowsEmpty: Story = {
  name: "followList-s4: フォローが0件のときは「フォローしているアカウントはありません」を出す",
  args: { handle: "dave.bsky.social" },
  beforeEach: () => emptyData("dave.bsky.social", "follows"),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("フォローしているアカウントはありません"),
    ).toBeVisible();
  },
};

export const FollowersEmpty: Story = {
  name: "followList-s5: フォロワーが0件のときは「フォロワーはいません」を出す",
  args: { handle: "dave.bsky.social", kind: "followers" },
  beforeEach: () => emptyData("dave.bsky.social", "followers"),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("フォロワーはいません"),
    ).toBeVisible();
  },
};

export const KnownFollowers: Story = {
  args: { kind: "followers" },
  parameters: {
    path: "/alice.bsky.social/followers?filter=known",
  },
  beforeEach: () => {
    queryClient.setQueryData(
      ["follow-list", alice.handle, "followers", "known"],
      infinite<typeof followListLoader>({
        subject: alice,
        accounts: [{ ...bob, description: "Bobの自己紹介" }],
      }),
    );
  },
};

export const KnownFollowersEmpty: Story = {
  name: "followList-s6: 「知り合い」タブが0件のときは「知り合いのフォロワーはいません」を出す",
  args: { handle: "dave.bsky.social", kind: "followers" },
  parameters: {
    path: "/dave.bsky.social/followers?filter=known",
  },
  beforeEach: () => emptyData("dave.bsky.social", "followers", "known"),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("知り合いのフォロワーはいません"),
    ).toBeVisible();
  },
};
