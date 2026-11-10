import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { infinite, queryClient } from "@/.storybook/query-client";
import type { TimelinePost } from "@/app/features/timeline/timeline-feed";
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

const setPost = (external: NonNullable<TimelinePost["external"]>) =>
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({
      posts: [
        {
          uri: "at://did:plc:example1/app.bsky.feed.post/1",
          cid: "bafyexample1",
          authorHandle: "alice.bsky.social",
          authorDisplayName: "Alice",
          text: "リンク付きの投稿",
          replyCount: 0,
          repostCount: 0,
          likeCount: 0,
          createdAt: new Date().toISOString(),
          external,
        },
      ],
    }),
  );

const tweet = {
  uri: "https://x.com/jack/status/20",
  title: "ツイート",
  description: "ツイートの説明",
};

export const LinkCard: Story = {
  name: "link-card-s1: リンクカードのサムネイル・タイトル・説明を投稿の中に表示し、選ぶとリンク先を新しいタブで開く",
  tags: ["play"],
  beforeEach: () => {
    setPost({
      uri: "https://example.com/link-card",
      title: "リンクカードのタイトル",
      description: "リンクカードの説明",
      thumb:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E",
    });
  },
  play: async ({ canvasElement }) => {
    const card = within(canvasElement).getByRole("link", {
      name: /リンクカードのタイトル/,
    });
    await expect(card).toHaveTextContent("リンクカードの説明");
    await expect(card).toHaveAttribute("href", "https://example.com/link-card");
    await expect(card).toHaveAttribute("target", "_blank");
    await waitFor(() =>
      expect(card.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
  },
};

export const TweetEmbed: Story = {
  name: "link-card-s2: リンク先がx.com・twitter.comのツイートの場合は、リンクカードの代わりにツイートを埋め込んで表示する",
  tags: ["play"],
  beforeEach: () => {
    setPost(tweet);
  },
  play: async ({ canvasElement }) => {
    const embed = canvasElement.querySelector("[data-tweet-id]");
    await expect(embed).toHaveAttribute("data-tweet-id", "20");
    await expect(
      within(canvasElement).queryByRole("link", { name: /ツイートの説明/ }),
    ).toBeNull();
    await waitFor(() =>
      expect(
        document.querySelector("script[src$='/widgets.js']"),
      ).not.toBeNull(),
    );
  },
};

export const TweetEmbedClick: Story = {
  name: "link-card-s3: 埋め込んだツイートの中を選んだ場合は、投稿の詳細へ遷移せずツイート側の操作を優先する",
  tags: ["play"],
  beforeEach: () => {
    setPost(tweet);
  },
  play: async ({ canvasElement }) => {
    const embed = canvasElement.querySelector("[data-tweet-id]");
    if (!(embed instanceof HTMLElement)) throw new Error("embed not found");
    const content = document.createElement("div");
    content.style.height = "40px";
    embed.append(content);
    const rect = embed.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + 5, rect.top + 5);
    await expect(embed.contains(hit)).toBe(true);
  },
};
