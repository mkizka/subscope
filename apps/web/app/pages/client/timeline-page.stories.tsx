import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { type Data, infinite, queryClient } from "@/.storybook/query-client";
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

type TimelinePost = Data<typeof timelineLoader>["posts"][number];

const dot =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E";
const image = { thumb: dot, fullsize: dot, alt: "画像" };
const external = {
  uri: "https://example.com/quote",
  title: "リンクカードのタイトル",
  description: "リンクカードの説明",
};

const quoting = (post: Partial<TimelinePost>): Story => ({
  tags: ["play"],
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({
        posts: [
          {
            uri: "at://did:plc:erin/app.bsky.feed.post/1",
            cid: "bafyquote",
            authorHandle: "erin.bsky.social",
            text: "引用した投稿",
            createdAt: new Date().toISOString(),
            ...post,
          },
        ],
      }),
    );
  },
});

const quote = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("blockquote");

export const QuoteText: Story = {
  ...quoting({
    quote: {
      authorHandle: "alice.bsky.social",
      authorDisplayName: "Alice",
      text: "引用される投稿",
    },
  }),
  name: "quote-s1: 引用している投稿の投稿者名と本文を、引用した投稿の中に表示する",
  play: async ({ canvasElement }) => {
    const q = quote(canvasElement);
    await expect(q).toHaveTextContent("Alice");
    await expect(q).toHaveTextContent("@alice.bsky.social");
    await expect(q).toHaveTextContent("引用される投稿");
  },
};

export const QuoteWithMedia: Story = {
  ...quoting({
    images: [{ ...image, alt: "引用した投稿の画像" }],
    quote: { authorHandle: "alice.bsky.social", text: "引用される投稿" },
  }),
  name: "quote-s2: 画像付きで引用した投稿は、画像と引用している投稿の両方を表示する",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("img", { name: "引用した投稿の画像" }),
    ).toBeVisible();
    await expect(quote(canvasElement)).toHaveTextContent("引用される投稿");
  },
};

export const QuoteImages: Story = {
  ...quoting({
    quote: {
      authorHandle: "alice.bsky.social",
      text: "引用される投稿",
      images: [{ ...image, alt: "引用される投稿の画像" }],
    },
  }),
  name: "quote-s3: 引用される投稿に付いた画像を、引用した投稿の中に表示する",
  play: async ({ canvasElement }) => {
    await expect(
      within(quote(canvasElement)).getByRole("img", {
        name: "引用される投稿の画像",
      }),
    ).toBeVisible();
  },
};

export const QuoteAvatar: Story = {
  ...quoting({
    quote: {
      authorHandle: "alice.bsky.social",
      authorAvatar: dot,
      text: "引用される投稿",
    },
  }),
  name: "quote-s4: 引用されている投稿の投稿者のアバターを、引用した投稿の中に表示する",
  play: async ({ canvasElement }) => {
    await expect(quote(canvasElement).querySelector("img")).toHaveAttribute(
      "src",
      dot,
    );
  },
};

export const QuoteExternal: Story = {
  ...quoting({
    quote: {
      authorHandle: "alice.bsky.social",
      text: "引用される投稿",
      external,
    },
  }),
  name: "quote-s5: 引用される投稿に付いたリンクカードを、引用した投稿の中に表示する",
  play: async ({ canvasElement }) => {
    await expect(
      within(quote(canvasElement)).getByRole("link", {
        name: /リンクカードのタイトル/,
      }),
    ).toHaveAttribute("href", external.uri);
  },
};

export const QuoteDeleted: Story = {
  ...quoting({ quoteUnavailable: "notFound" }),
  name: "quote-s6: 引用される投稿が削除されている場合は、削除されたことを示す枠を引用した投稿の中に表示する",
  play: async ({ canvasElement }) => {
    await expect(quote(canvasElement)).toHaveTextContent("削除されました");
  },
};

export const QuoteFeed: Story = {
  ...quoting({
    quotedFeed: {
      displayName: "フィード名",
      creatorHandle: "alice.bsky.social",
      description: "フィードの説明",
    },
  }),
  name: "quote-s7: フィードジェネレーターを引用した投稿は、フィード名・作成者・説明を枠で囲んで表示する",
  play: async ({ canvasElement }) => {
    const q = quote(canvasElement);
    await expect(q).toHaveTextContent("フィード名");
    await expect(q).toHaveTextContent("@alice.bsky.social");
    await expect(q).toHaveTextContent("フィードの説明");
  },
};

export const QuoteLink: Story = {
  ...quoting({
    quote: {
      authorHandle: "alice.bsky.social",
      text: "引用される投稿 example.com/quote...",
      links: [{ byteStart: 22, byteEnd: 42, uri: "https://example.com/full" }],
    },
  }),
  name: "quote-s8: 引用される投稿の本文は、通常の投稿と同じくfacetsでリンクが付いた範囲をリンクにする",
  play: async ({ canvasElement }) => {
    await expect(
      within(quote(canvasElement)).getByRole("link", {
        name: "example.com/quote...",
      }),
    ).toHaveAttribute("href", "https://example.com/full");
  },
};
