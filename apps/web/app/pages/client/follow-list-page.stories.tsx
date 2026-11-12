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

export const SyncStatus: Story = {
  name: "follow-list-s1: 一覧の追跡アカウントには過去の投稿の同期状態を表示する",
  beforeEach: () => {
    queryClient.setQueryData(
      ["follow-list", alice.handle, "follows", "all"],
      infinite<typeof followListLoader>({
        subject: alice,
        accounts: [{ ...bob, backfillStatus: "completed" }],
      }),
    );
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("同期済み", { exact: true }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  name: "follow-list-s2: 一覧を開くと、読み込みを待たずに見出しを表示し、読み込み終えるまでスケルトンを表示する",
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["follow-list", alice.handle] });
    queryClient
      .query({
        queryKey: ["follow-list", alice.handle, "follows", "all"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "フォロー" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};

export const FollowersTabs: Story = {
  name: "follow-list-s3: フォロワー一覧に「すべて」「知り合い」「メンバー」のタブを表示し、「メンバー」には人数を添える",
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
  name: "follow-list-s4: 読み込みが終わって0件のときは、フォロー一覧には「フォローしているアカウントはありません」を表示する",
  args: { handle: "dave.bsky.social" },
  beforeEach: () => emptyData("dave.bsky.social", "follows"),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("フォローしているアカウントはありません"),
    ).toBeVisible();
  },
};

export const FollowersEmpty: Story = {
  name: "follow-list-s5: 読み込みが終わって0件のときは、フォロワー一覧には「フォロワーはいません」を表示する",
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
  name: "follow-list-s6: 「知り合い」タブの読み込みが終わって0件のときは、「知り合いのフォロワーはいません」を表示する",
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
