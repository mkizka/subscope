import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { alice, infinite, queryClient } from "@/.storybook/query-client";
import { ListsContainer } from "@/app/features/list/lists-container";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as profileLoader } from "@/app/routes/api.profile.$handle";

import { ProfilePage } from "./profile-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["profile", alice.handle, ""],
      infinite<typeof profileLoader>({
        profile: {
          ...alice,
          description: "Blueskyを使っています。",
          followsCount: 120,
          followersCount: 345,
        },
        isSelf: false,
        backfillStatus: "completed",
        posts: TimelineFeedStories.args.posts,
        tab: "posts",
      }),
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
    queryClient.setQueryData(
      ["profile", alice.handle, ""],
      infinite<typeof profileLoader>({
        profile: {
          did: alice.did,
          handle: alice.handle,
          displayName: alice.displayName,
          followsCount: 0,
          followersCount: 0,
        },
        isSelf: false,
        backfillStatus: "completed",
        posts: [],
        tab: "posts",
      }),
    );
  },
};

export const Untracked: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["profile", alice.handle, ""],
      infinite<typeof profileLoader>({
        profile: {
          ...alice,
          description: "Blueskyを使っています。",
          followsCount: 120,
          followersCount: 345,
        },
        isSelf: false,
        posts: TimelineFeedStories.args.posts,
        tab: "posts",
      }),
    );
  },
};

const svg = (color: string): `data:${string}` =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23${color}'/%3E%3C/svg%3E`;

export const ImageViewerProfile: Story = {
  name: "image-viewer-s7: プロフィール全体ページのアイコンかバナーを選ぶと、その画像を拡大して表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.setQueryData(
      ["profile", alice.handle, ""],
      infinite<typeof profileLoader>({
        profile: {
          ...alice,
          avatar: svg("d97750"),
          banner: svg("d97751"),
          followsCount: 0,
          followersCount: 0,
        },
        isSelf: false,
        backfillStatus: "completed",
        posts: [],
        tab: "posts",
      }),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = () =>
      screen.queryByRole("dialog", { name: "画像の拡大表示" });
    const viewerSrc = () => dialog()?.querySelector("img")?.getAttribute("src");

    await userEvent.click(
      await canvas.findByRole("button", { name: "アイコンを拡大" }),
    );
    await waitFor(() => expect(viewerSrc()).toBe(svg("d97750")));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "バナーを拡大" }));
    await waitFor(() => expect(viewerSrc()).toBe(svg("d97751")));
  },
};

const ListsTab = () => <ListsContainer handle={alice.handle} />;

export const ListsLoading: Story = {
  name: "list-s5: リスト一覧を開くと、リストの読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
  tags: ["play"],
  parameters: {
    path: "/alice.bsky.social/lists",
    route: {
      path: "/:handle",
      children: [{ path: "lists", Component: ListsTab }],
    },
  },
  beforeEach: () => {
    void queryClient.query({
      queryKey: ["lists", alice.handle],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "リスト" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};
