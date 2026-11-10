import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  alice,
  type Data,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
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

const desktop = { viewport: { value: "desktop" } };
const mobile = { viewport: { value: "mobile1" } };

const sideNav = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("navigation"));

const tabBar = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("navigation", { name: "タブバー" }));

const rightColumn = (canvasElement: HTMLElement) => {
  const aside = within(canvasElement).getAllByRole("complementary").at(-1);
  if (!aside) throw new Error("右カラムがありません");
  return within(aside);
};

export const SideNavCurrent: Story = {
  name: "layout-s1: 左カラムのメニューで、今いるページの項目を強調する",
  tags: ["play"],
  globals: desktop,
  play: async ({ canvasElement }) => {
    const nav = sideNav(canvasElement);

    await expect(nav.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "通知" })).not.toHaveAttribute(
      "aria-current",
    );
  },
};

export const SideNavHandle: Story = {
  name: "layout-s2: 左カラムのアカウント欄に、自分のハンドルを表示する",
  tags: ["play"],
  globals: desktop,
  play: async ({ canvasElement }) => {
    await expect(
      sideNav(canvasElement).getByText(`@${alice.handle}`),
    ).toBeVisible();
  },
};

export const ServerCard: Story = {
  name: "layout-s3: 右カラムに、見出し「サーバーについて」と「SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。」を出したカードを表示し、カード全体を `/server` へのリンクにする",
  tags: ["play"],
  globals: desktop,
  play: async ({ canvasElement }) => {
    const card = rightColumn(canvasElement).getByRole("link", {
      name: /サーバーについて/,
    });

    await expect(card).toHaveTextContent(
      "SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。",
    );
    await expect(card).toHaveAttribute("href", "/server");
  },
};

export const TabBarCurrent: Story = {
  name: "layout-s4: モバイルでは、下のタブで今いるページの項目を強調する",
  tags: ["play"],
  globals: mobile,
  play: async ({ canvasElement }) => {
    const tabs = tabBar(canvasElement);

    await expect(tabs.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tabs.getByRole("link", { name: "検索" })).not.toHaveAttribute(
      "aria-current",
    );
  },
};

const openDrawer = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "メニューを開く" }),
  );
  return within(
    within(canvasElement).getByRole("dialog", { name: "メニュー" }),
  );
};

export const DrawerItems: Story = {
  name: "layout-s5: モバイルのドロワーには、PCの左カラムと同じメニュー項目を並べる",
  tags: ["play"],
  globals: mobile,
  play: async ({ canvasElement }) => {
    const pcItems = [...canvasElement.querySelectorAll("aside nav a")].map(
      (a) => a.textContent,
    );

    const drawer = await openDrawer(canvasElement);

    await expect(drawer.getAllByRole("link").map((a) => a.textContent)).toEqual(
      pcItems,
    );
  },
};

export const ServerMenu: Story = {
  name: "layout-s6: 左カラムとモバイルのドロワーのメニューの「サーバー」から `/server` に移動できる",
  tags: ["play"],
  globals: mobile,
  play: async ({ canvasElement }) => {
    const drawer = await openDrawer(canvasElement);

    await expect(
      drawer.getByRole("link", { name: "サーバー" }),
    ).toHaveAttribute("href", "/server");
    await expect(
      canvasElement.querySelector('aside nav a[href="/server"]'),
    ).not.toBeNull();
  },
};

const seedHistory = (words: string[]): (() => void) => {
  localStorage.setItem("search-history", JSON.stringify(words));
  return () => localStorage.removeItem("search-history");
};

const openHistory = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    rightColumn(canvasElement).getByRole("searchbox", { name: "検索語" }),
  );
  return rightColumn(canvasElement).findByRole("list", { name: "検索履歴" });
};

export const HistoryList: Story = {
  name: "layout-s7: 右カラムの検索ボックスにフォーカスして何も入力していないとき、過去に検索した語を新しい順に最大10件、検索ボックスの下に表示する",
  tags: ["play"],
  globals: desktop,
  beforeEach: () =>
    seedHistory(Array.from({ length: 11 }, (_, i) => `word${11 - i}`)),
  play: async ({ canvasElement }) => {
    const items = within(await openHistory(canvasElement)).getAllByRole(
      "listitem",
    );

    await expect(items).toHaveLength(10);
    await expect(items[0]).toHaveTextContent("word11");
  },
};

export const HistorySelect: Story = {
  name: "layout-s8: 右カラムの履歴の語を選ぶと、その語で検索する",
  tags: ["play"],
  globals: desktop,
  beforeEach: () => seedHistory(["bar", "foo"]),
  play: async ({ canvasElement }) => {
    const history = within(await openHistory(canvasElement));

    await expect(history.getByRole("link", { name: "foo" })).toHaveAttribute(
      "href",
      "/search?q=foo",
    );
  },
};

export const HistoryRemove: Story = {
  name: "layout-s9: 右カラムの履歴の語は個別に、または「履歴を全て削除」で全て削除できる",
  tags: ["play"],
  globals: desktop,
  beforeEach: () => seedHistory(["bar", "foo"]),
  play: async ({ canvasElement }) => {
    const history = within(await openHistory(canvasElement));

    await userEvent.click(history.getByRole("button", { name: "fooを削除" }));
    await expect(history.queryByText("foo")).toBeNull();
    await expect(history.getByText("bar")).toBeVisible();

    await userEvent.click(
      rightColumn(canvasElement).getByRole("button", {
        name: "履歴を全て削除",
      }),
    );
    await waitFor(() =>
      expect(
        rightColumn(canvasElement).queryByRole("list", { name: "検索履歴" }),
      ).toBeNull(),
    );
  },
};

export const Skeleton: Story = {
  name: "layout-s11: スケルトンは、左から右へ光が流れるアニメーションで読み込み中であることを示す",
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
    const skeleton = within(canvasElement)
      .getByRole("status", { name: "読み込み中" })
      .querySelector(".skeleton");

    await expect(skeleton).not.toBeNull();
    await expect(skeleton && getComputedStyle(skeleton).animationName).toBe(
      "skeleton-shimmer",
    );
  },
};

export const TabBarIconOnly: Story = {
  name: "layout-s12: モバイルでは、下のタブにラベル文字を出さず、アイコンだけを表示する",
  tags: ["play"],
  globals: mobile,
  play: async ({ canvasElement }) => {
    const tabs = tabBar(canvasElement);

    await expect(tabs.getByRole("link", { name: "ホーム" })).toBeVisible();
    await expect(tabs.queryByText("ホーム")).toBeNull();
    await expect(tabs.queryByText("プロフィール")).toBeNull();
  },
};

export const StackingOrder: Story = {
  name: "layout-s13: 重なり順は下から、本文・埋め込み、浮かせた表示、固定の見出し、固定の下タブ、検索候補の順にする",
  tags: ["play"],
  globals: mobile,
  play: async ({ canvasElement }) => {
    const z = (el: Element) => Number(getComputedStyle(el).zIndex);
    const tabsEl = within(canvasElement).getByRole("navigation", {
      name: "タブバー",
    });
    const header = z(within(canvasElement).getByRole("banner"));
    const tabs = z(tabsEl);

    await expect(header).toBeGreaterThan(0);
    await expect(tabs).toBeGreaterThan(header);
  },
};
