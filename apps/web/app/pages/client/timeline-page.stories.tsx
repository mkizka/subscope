import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { alice, bob, infinite, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as timelineLoader } from "@/app/routes/api.timeline";

import { TimelinePage } from "./timeline-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({
        posts: TimelineFeedStories.args.posts,
      }),
    );
  },
  component: TimelinePage,
  args: { local: false },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelinePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({ posts: [] }),
    );
  },
};

export const LongText: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({
        posts: [
          {
            uri: "at://did:plc:long/app.bsky.feed.post/1",
            cid: "bafylong",
            authorHandle:
              "very-long-handle-for-wrapping-check.example.bsky.social",
            authorDisplayName: "とても長い表示名".repeat(8),
            text: "長い文章です。".repeat(40) + "x".repeat(120),
            replyCount: 0,
            repostCount: 0,
            likeCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );
  },
};

export const Local: Story = {
  args: { local: true },
  beforeEach: () => {
    queryClient.setQueryData(
      ["local-timeline"],
      infinite<typeof timelineLoader>({
        posts: TimelineFeedStories.args.posts,
      }),
    );
  },
};

const toolbarPosts = [
  {
    uri: `at://${alice.did}/app.bsky.feed.post/1`,
    cid: "bafyalice",
    authorHandle: alice.handle,
    text: "自分の投稿",
    replyCount: 0,
    repostCount: 0,
    likeCount: 1,
    viewerLike: `at://${alice.did}/app.bsky.feed.like/1`,
    createdAt: new Date().toISOString(),
  },
  {
    uri: `at://${bob.did}/app.bsky.feed.post/1`,
    cid: "bafybob",
    authorHandle: bob.handle,
    text: "他人の投稿",
    replyCount: 0,
    repostCount: 0,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const withToolbarPosts = () => {
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts: toolbarPosts }),
  );
};

const article = (root: HTMLElement, text: string) => {
  const found = within(root)
    .getAllByRole("article")
    .find((el) => el.textContent.includes(text));
  if (!found) throw new Error(`article not found: ${text}`);
  return within(found);
};

export const DeleteOnlyOwnPost: Story = {
  name: "post-toolbar-s1: 「…」メニューの削除は、自分の投稿にだけ表示する",
  tags: ["play"],
  beforeEach: withToolbarPosts,
  play: async ({ canvasElement }) => {
    const mine = article(canvasElement, "自分の投稿");
    const others = article(canvasElement, "他人の投稿");

    await userEvent.click(mine.getByRole("button", { name: "投稿のメニュー" }));
    await expect(mine.getByRole("button", { name: "削除" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      others.getByRole("button", { name: "投稿のメニュー" }),
    );
    await expect(others.queryByRole("button", { name: "削除" })).toBeNull();
  },
};

export const LikedHeartFilled: Story = {
  name: "post-toolbar-s2: いいね済みの投稿のいいねボタンは、ハートを塗りつぶして表示する",
  tags: ["play"],
  beforeEach: withToolbarPosts,
  play: async ({ canvasElement }) => {
    const heart = (text: string) =>
      article(canvasElement, text).getByRole("button", { name: "いいね" });

    await expect(heart("自分の投稿").querySelector("svg")).not.toHaveStyle({
      fill: "none",
    });
    await expect(heart("他人の投稿").querySelector("svg")).toHaveStyle({
      fill: "none",
    });
  },
};

const imagePost = (images: number) => ({
  uri: "at://did:plc:alice/app.bsky.feed.post/images",
  cid: "bafyimages",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "画像付きの投稿",
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: new Date().toISOString(),
  images: Array.from({ length: images }, (_, i) => ({
    thumb: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E#${i}`,
    fullsize: "",
    alt: "投稿画像",
    aspectRatio: { width: 1, height: 1 },
  })),
});

const setImagePost = (images: number) => () => {
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts: [imagePost(images)] }),
  );
};

export const SingleImage: Story = {
  name: "post-images-s1: 画像が1枚のときは、投稿の幅いっぱいに表示する",
  tags: ["play"],
  beforeEach: setImagePost(1),
  play: async ({ canvasElement }) => {
    const post = within(canvasElement).getByRole("article");
    const image = await within(post).findByRole("img", { name: "投稿画像" });

    await expect(image.getBoundingClientRect().width).toBe(
      within(post).getByText("画像付きの投稿").getBoundingClientRect().width,
    );
  },
};

export const ManyImages: Story = {
  name: "post-images-s2: 画像が5枚以上のときは、横スクロールで表示する",
  tags: ["play"],
  beforeEach: setImagePost(5),
  play: async ({ canvasElement }) => {
    const post = within(canvasElement).getByRole("article");
    const [image] = await within(post).findAllByRole("img", {
      name: "投稿画像",
    });
    const scroller = image?.closest("button")?.parentElement;

    await expect(scroller).toBeTruthy();
    await expect(scroller?.scrollWidth).toBeGreaterThan(
      scroller?.clientWidth ?? 0,
    );
  },
};
