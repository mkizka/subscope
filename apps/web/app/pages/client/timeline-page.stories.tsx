import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { type Data, infinite, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as backfillStatusLoader } from "@/app/routes/api.backfill-status";
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

const setBackfillStatus = (
  status: Data<typeof backfillStatusLoader>["status"],
) => {
  queryClient.setQueryData<Data<typeof backfillStatusLoader>>(
    ["backfill-status"],
    {
      status,
    },
  );
};

export const BackfillInProgress: Story = {
  name: "backfillBanner-s1: 自分の同期中は、「過去の投稿を同期しています」の帯を出す",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("inProgress"),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/過去の投稿を同期しています/),
    ).toBeVisible();
  },
};

export const BackfillError: Story = {
  name: "backfillBanner-s2: 自分の同期がエラーなら、「過去の投稿を同期できていません」の帯を出す",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("error"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/過去の投稿を同期できていません/),
    ).toBeVisible();
    await expect(canvas.queryByText(/過去の投稿を同期しています/)).toBeNull();
  },
};

export const BackfillCompleted: Story = {
  name: "backfillBanner-s3: 自分の同期が終わっていれば、帯を出さない",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("completed"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("tab", { name: "フォロー中" }),
    ).toBeVisible();
    await expect(canvas.queryByText(/過去の投稿を/)).toBeNull();
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

const video = {
  playlist: "https://video.bsky.app/watch/did/cid/playlist.m3u8",
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23d97757'/%3E%3C/svg%3E",
  alt: "サンプル動画",
  aspectRatio: { width: 16, height: 9 },
};

const videoPost = {
  uri: "at://did:plc:alice/app.bsky.feed.post/video",
  cid: "bafyvideo",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "動画つきの投稿",
  createdAt: new Date().toISOString(),
};

const withVideoPosts = (post: object) => () => {
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts: [{ ...videoPost, ...post }] }),
  );
};

const player = (canvasElement: HTMLElement) =>
  waitFor(async () => {
    const el = within(canvasElement).getByLabelText("サンプル動画");
    await expect(el).toHaveProperty("tagName", "HLS-VIDEO");
    return el;
  });

export const VideoCenteredPlay: Story = {
  name: "post-video-s1: 停止中は、動画の中央に再生ボタンを表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    await player(canvasElement);
    await expect(
      canvasElement.querySelector('[slot="centered-chrome"]'),
    ).toBeVisible();
  },
};

export const VideoTime: Story = {
  name: "post-video-s2: 再生ボタンの横に、経過時間と動画の長さを表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    await player(canvasElement);
    const bar = canvasElement.querySelector("media-control-bar");
    await expect(bar?.querySelector("media-play-button")).not.toBeNull();
    await expect(bar?.querySelector("media-time-display")).not.toBeNull();
  },
};

export const VideoThumbnailAndLabel: Story = {
  name: "post-video-s3: 動画はサムネイルを表示し、ALTをプレイヤーのラベルにする",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el).toHaveAttribute("poster", video.thumbnail);
  },
};

export const QuotedVideo: Story = {
  name: "post-video-s4: 引用された投稿に付いた動画を、引用した投稿の中に表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({
    quote: { authorHandle: "bob.bsky.social", text: "引用された動画", video },
  }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el.closest("blockquote")).not.toBeNull();
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
  play: async ({ canvasElement }) => {
    await expect(
      within(quote(canvasElement)).getByRole("link", {
        name: "example.com/quote...",
      }),
    ).toHaveAttribute("href", "https://example.com/full");
  },
};
