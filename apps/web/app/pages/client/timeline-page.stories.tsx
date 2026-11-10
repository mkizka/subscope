import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, within } from "storybook/test";

import { type Data, infinite, queryClient } from "@/.storybook/query-client";
import type { TextLink } from "@/app/features/post/rich-text";
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

type Post = Data<typeof timelineLoader>["posts"][number];

const post = (id: string, overrides: Partial<Post> = {}): Post => ({
  uri: `at://did:plc:alice/app.bsky.feed.post/${id}`,
  cid: `bafy${id}`,
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: id,
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const setPosts = (posts: Post[], cursor?: string) =>
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts, cursor }),
  );

const link = (text: string, label: string, feature: Partial<TextLink>) => {
  const encoder = new TextEncoder();
  const byteStart = encoder.encode(text.slice(0, text.indexOf(label))).length;
  return {
    text,
    links: [
      {
        byteStart,
        byteEnd: byteStart + encoder.encode(label).length,
        ...feature,
      },
    ],
  };
};

export const Counts: Story = {
  name: "timeline-s1: いいね数・リポスト数は1以上のときだけ表示する",
  tags: ["play"],
  beforeEach: () => {
    setPosts([
      post("反応あり", { likeCount: 1, repostCount: 1 }),
      post("反応なし"),
    ]);
  },
  play: async ({ canvasElement }) => {
    const article = (name: string) =>
      within(
        within(canvasElement).getByText(name).closest<HTMLElement>("article") ??
          canvasElement,
      );
    await expect(article("反応あり").getByTitle("1件のいいね")).toBeVisible();
    await expect(article("反応あり").getByTitle("1件のリポスト")).toBeVisible();
    await expect(article("反応なし").queryByTitle(/いいね/)).toBeNull();
    await expect(article("反応なし").queryByTitle(/リポスト/)).toBeNull();
  },
};

export const ExternalLink: Story = {
  name: "timeline-s2: 本文のうちfacetsでリンクが付いた範囲は、そのURLを新しいタブで開くリンクにする",
  tags: ["play"],
  beforeEach: () => {
    const label = "example.com/timeline...";
    setPosts([
      post("link", {
        ...link(`日本語のあと ${label} 後ろ`, label, {
          uri: "https://example.com/timeline/full",
        }),
      }),
    ]);
  },
  play: async ({ canvasElement }) => {
    const anchor = within(canvasElement).getByRole("link", {
      name: "example.com/timeline...",
    });
    await expect(anchor).toHaveAttribute(
      "href",
      "https://example.com/timeline/full",
    );
    await expect(anchor).toHaveAttribute("target", "_blank");
  },
};

export const Mention: Story = {
  name: "timeline-s3: 本文のうちfacetsでメンションが付いた範囲は、そのアカウントのプロフィール全体ページへのリンクにする",
  tags: ["play"],
  beforeEach: () => {
    setPosts([
      post("mention", {
        ...link("こんにちは @bob.bsky.social さん", "@bob.bsky.social", {
          did: "did:plc:bob",
        }),
      }),
    ]);
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "@bob.bsky.social" }),
    ).toHaveAttribute("href", "/did:plc:bob");
  },
};

export const LoadingMore: Story = {
  name: "timeline-s4: 続きの古い投稿を読み込み終えるまで、一覧の下にスピナーを表示する",
  tags: ["play"],
  beforeEach: () => {
    setPosts([post("1")], "next");
    const spy = spyOn(window, "fetch").mockReturnValue(new Promise(() => {}));
    return () => spy.mockRestore();
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("status", { name: "続きを読み込み中" }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  name: "timeline-s5: タイムラインを開くと、投稿の読み込みを待たずに画面を表示し、読み込み終えるまで、アイコン・名前・本文・ツールバーを持つ投稿の形のスケルトンを表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["timeline"] });
    queryClient
      .query({
        queryKey: ["timeline"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "フォロー中" })).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};

export const ThreadOrder: Story = {
  name: "timeline-s6: 一覧の中に返信先の投稿があれば、間に別の投稿があっても返信先を上にして古い順に並べ、アイコンの間を線で繋げる",
  tags: ["play"],
  beforeEach: () => {
    const root = post("起点");
    setPosts([
      post("返信", { replyParentUri: root.uri }),
      post("間の投稿"),
      root,
    ]);
  },
  play: async ({ canvasElement }) => {
    const articles = within(canvasElement).getAllByRole("article");
    await expect(articles.map((a) => a.textContent)).toEqual([
      expect.stringContaining("起点"),
      expect.stringContaining("返信"),
      expect.stringContaining("間の投稿"),
    ]);
    await expect(
      within(canvasElement).getAllByTestId("thread-line"),
    ).toHaveLength(2);
  },
};

const reposted = () => {
  setPosts([
    post("repost", {
      reasonRepost: {
        byDisplayName: "Charlie",
        byHandle: "charlie.bsky.social",
      },
    }),
  ]);
};

export const RepostAboveAvatar: Story = {
  name: "timeline-s7: リポストした人の表示は、投稿者のアイコンより上の行に出す",
  tags: ["play"],
  beforeEach: reposted,
  play: async ({ canvasElement }) => {
    const canvas = within(within(canvasElement).getByRole("article"));
    const top = (el?: HTMLElement) => el?.getBoundingClientRect().top ?? 0;
    await expect(top(canvas.getByText("Charlieがリポスト"))).toBeLessThan(
      top(canvas.getAllByRole("link", { name: "Alice" }).at(0)),
    );
  },
};

export const AuthorHandle: Story = {
  name: "timeline-s8: 投稿には、投稿者の名前の隣にハンドルを表示する",
  tags: ["play"],
  beforeEach: () => {
    setPosts([post("handle")]);
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(within(canvasElement).getByRole("article")).getByText(
        "@alice.bsky.social",
      ),
    ).toBeVisible();
  },
};

export const RepostLink: Story = {
  name: "timeline-s9: 「○○がリポスト」をタップすると、投稿ではなく○○のプロフィール全体ページを開く",
  tags: ["play"],
  beforeEach: reposted,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "Charlieがリポスト" }),
    ).toHaveAttribute("href", "/charlie.bsky.social");
  },
};

export const Hashtag: Story = {
  name: "timeline-s10: 本文のうちfacetsでハッシュタグが付いた範囲は、そのハッシュタグを投稿タブで検索する検索ページ（`/search?q=%23タグ`）へのリンクにする",
  tags: ["play"],
  beforeEach: () => {
    setPosts([
      post("tag", {
        ...link("こんにちは #タグ です", "#タグ", { tag: "タグ" }),
      }),
    ]);
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "#タグ" }),
    ).toHaveAttribute("href", `/search?${new URLSearchParams({ q: "#タグ" })}`);
  },
};

export const OmittedPosts: Story = {
  name: "timeline-s11: 線で繋げた投稿が4件以上ある場合は、起点・最後の投稿の返信先・最後の投稿の3件だけを表示し、起点と返信先の間に省略した投稿の件数を、リンクと分かる見た目で点線つきで表示する。この表示は、最後の投稿のスレッドページへのリンクにする",
  tags: ["play"],
  beforeEach: () => {
    const chain = [post("t1")];
    for (const n of [2, 3, 4, 5]) {
      chain.push(post(`t${n}`, { replyParentUri: chain.at(-1)?.uri }));
    }
    setPosts(chain.reverse());
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("article").map((a) => a.textContent),
    ).toEqual([
      expect.stringContaining("t1"),
      expect.stringContaining("t4"),
      expect.stringContaining("t5"),
    ]);
    const omitted = canvas.getByTestId("omitted-posts");
    await expect(omitted).toHaveTextContent("2件の投稿");
    await expect(omitted).toHaveAttribute("href", "/alice.bsky.social/post/t5");
  },
};
