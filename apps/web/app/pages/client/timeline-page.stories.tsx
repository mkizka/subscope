import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  screen,
  spyOn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import {
  alice,
  bob,
  type Data,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
import { ComposeProvider } from "@/app/features/post/post-form-container";
import type { TextLink } from "@/app/features/post/rich-text";
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
  decorators: [
    (Story) => (
      <ComposeProvider>
        <Story />
      </ComposeProvider>
    ),
  ],
  args: { local: false },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelinePage>;

export default meta;
type Story = StoryObj<typeof meta>;

type TimelinePost = Data<typeof timelineLoader>["posts"][number];

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

const svg = (color: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23${color}'/%3E%3C/svg%3E`;

const viewerPost = (alts: string[]) => ({
  uri: "at://did:plc:alice/app.bsky.feed.post/images",
  cid: "bafyimages",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "画像つきの投稿",
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: new Date().toISOString(),
  images: alts.map((alt, i) => ({
    thumb: svg(`d9775${i}`),
    fullsize: svg(`d9775${i}`),
    alt,
  })),
});

const withImages =
  (alts: string[]): Story["beforeEach"] =>
  () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({ posts: [viewerPost(alts)] }),
    );
  };

const openViewer = async (canvasElement: HTMLElement, alt: string) => {
  await userEvent.click(
    await within(canvasElement).findByRole("button", { name: alt }),
  );
  return within(await screen.findByRole("dialog", { name: "画像の拡大表示" }));
};

export const ImageViewerOpen: Story = {
  name: "image-viewer-s1: 投稿画像を選ぶと、スレッドは開かずに元サイズの画像を拡大して表示する",
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");

    await expect(viewer.getByRole("img")).toHaveAttribute("src", svg("d97750"));
  },
};

export const ImageViewerNavigate: Story = {
  name: "image-viewer-s2: 画像が複数あるときは、前後の画像に切り替えられる",
  beforeEach: withImages(["画像1", "画像2"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像1");

    await userEvent.click(viewer.getByRole("button", { name: "次の画像" }));
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像2" })).toBeInTheDocument(),
    );
    await userEvent.click(viewer.getByRole("button", { name: "前の画像" }));
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像1" })).toBeInTheDocument(),
    );
  },
};

export const ImageViewerAlt: Story = {
  name: "image-viewer-s3: 拡大した画像の下にALTを表示する",
  beforeEach: withImages(["ALTの文章"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "ALTの文章");

    await waitFor(() => expect(viewer.getByText("ALTの文章")).toBeVisible());
  },
};

export const ImageViewerClose: Story = {
  name: "image-viewer-s4: 閉じるボタンかEscキーで閉じる",
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");
    const dialog = () =>
      screen.queryByRole("dialog", { name: "画像の拡大表示" });

    await userEvent.click(viewer.getByRole("button", { name: "画像を閉じる" }));
    await waitFor(() => expect(dialog()).toBeNull());
    await openViewer(canvasElement, "画像");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
  },
};

export const ImageViewerSwipe: Story = {
  name: "image-viewer-s5: 画像が複数あるときは、横スワイプで前後の画像に切り替えられる",
  beforeEach: withImages(["画像1", "画像2"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像1");
    const target = viewer.getByRole("img", { name: "画像1" });
    const swipe = async (dx: number) => {
      const init = {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        bubbles: true,
      };
      await fireEvent.pointerDown(target, {
        ...init,
        clientX: 300,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerMove(target, {
        ...init,
        clientX: 300 + dx / 2,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerMove(target, {
        ...init,
        clientX: 300 + dx,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerUp(target, {
        ...init,
        clientX: 300 + dx,
        clientY: 200,
      });
    };

    await swipe(-200);
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像2" })).toBeInTheDocument(),
    );
    await swipe(200);
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像1" })).toBeInTheDocument(),
    );
  },
};

export const ImageViewerZoom: Story = {
  name: "image-viewer-s6: 拡大表示した画像はピンチ操作か拡大ボタンでさらにズームできる",
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");
    const image = viewer.getByRole("img");
    const before = image.getBoundingClientRect().width;

    await userEvent.click(viewer.getByRole("button", { name: "拡大" }));
    await waitFor(() =>
      expect(image.getBoundingClientRect().width).toBeGreaterThan(before),
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
  name: "post-toolbar-s1: 「…」メニューの削除は自分の投稿にだけ表示する",
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
  name: "post-toolbar-s2: いいね済みの投稿のいいねボタンはハートを塗りつぶして表示する",
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
  name: "backfillBanner-s1: 自分の同期中は「過去の投稿を同期しています」の帯を出す",
  beforeEach: () => setBackfillStatus("inProgress"),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/過去の投稿を同期しています/),
    ).toBeVisible();
  },
};

export const BackfillError: Story = {
  name: "backfillBanner-s2: 自分の同期がエラーなら、「過去の投稿を同期できていません」の帯を出す",
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
  name: "post-video-s1: 停止中は動画の中央に再生ボタンを表示する",
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
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el).toHaveAttribute("poster", video.thumbnail);
  },
};

export const QuotedVideo: Story = {
  name: "post-video-s4: 引用された投稿に付いた動画を、引用した投稿の中に表示する",
  beforeEach: withVideoPosts({
    quote: { authorHandle: "bob.bsky.social", text: "引用された動画", video },
  }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el.closest("blockquote")).not.toBeNull();
  },
};

const png = (name: string) =>
  new File(
    [
      Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        ),
        (c) => c.charCodeAt(0),
      ),
    ],
    name,
    { type: "image/png" },
  );

const openCompose = async (canvasElement: HTMLElement) => {
  const [button] = within(canvasElement).getAllByRole("button", {
    name: "新規投稿",
  });
  if (!button) throw new Error("no button");
  await userEvent.click(button);
  return within(canvasElement).findByRole("dialog");
};

const openComposeFromPost = async (
  canvasElement: HTMLElement,
  button: string,
) => {
  const canvas = within(canvasElement);
  const [post] = await canvas.findAllByRole("article");
  if (!post) throw new Error("no post");
  await userEvent.click(within(post).getByRole("button", { name: button }));
  return canvas.findByRole("dialog");
};

const addImages = async (dialogElement: HTMLElement, count: number) => {
  const dialog = within(dialogElement);
  await userEvent.upload(
    dialog.getByLabelText("画像を追加"),
    Array.from({ length: count }, (_, i) => png(`${i + 1}.png`)),
  );
};

const writeAlt = async (dialogElement: HTMLElement, n: number, alt: string) => {
  const dialog = within(dialogElement);
  await userEvent.click(
    dialog.getByRole("button", { name: `画像${n}のALTを編集` }),
  );
  const altDialog = within(
    await dialog.findByRole("dialog", { name: "ALTを追加" }),
  );
  await userEvent.type(altDialog.getByRole("textbox", { name: "ALT" }), alt);
  await userEvent.click(altDialog.getByRole("button", { name: "完了" }));
};

export const PostFormTextLimit: Story = {
  name: "post-form-s1: 300字を超えると投稿できない",
  play: async ({ canvasElement }) => {
    const dialog = within(await openCompose(canvasElement));
    const textbox = dialog.getByRole("textbox", { name: "投稿内容" });
    const submit = dialog.getByRole("button", { name: /^投稿$/ });

    await userEvent.click(textbox);
    await userEvent.paste("あ".repeat(300));
    await expect(submit).toBeEnabled();
    await userEvent.type(textbox, "あ");
    await expect(submit).toBeDisabled();
  },
};

export const PostFormImageLimit: Story = {
  name: "post-form-s2: 画像は4枚まで添付できる",
  play: async ({ canvasElement }) => {
    const dialogElement = await openCompose(canvasElement);
    const dialog = within(dialogElement);

    await addImages(dialogElement, 4);

    await expect(
      dialog.getAllByRole("button", { name: /のALTを編集$/ }),
    ).toHaveLength(4);
    await expect(dialog.getByLabelText("画像を追加")).toBeDisabled();
  },
};

export const PostFormAuthor: Story = {
  name: "post-form-s3: 入力欄に添えて、自分のアイコン・名前・ハンドルを表示する",
  play: async ({ canvasElement }) => {
    const dialog = within(await openCompose(canvasElement));

    await expect(dialog.getByText("@alice.bsky.social")).toBeVisible();
  },
};

export const PostFormReply: Story = {
  name: "post-form-s4: 返信するときは、自分の名前の上に返信先の投稿の投稿者名・ハンドル・本文を表示し、投稿ボタンを「返信」にする",
  play: async ({ canvasElement }) => {
    const dialog = within(await openComposeFromPost(canvasElement, "返信"));
    const target = dialog.getByRole("article", { name: "返信先" });

    await expect(target).toHaveTextContent("Alice");
    await expect(target).toHaveTextContent("@alice.bsky.social");
    await expect(target).toHaveTextContent(
      "こんにちは！今日はいい天気ですね。",
    );
    await expect(dialog.getByRole("button", { name: /^返信$/ })).toBeVisible();
  },
};

export const PostFormQuote: Story = {
  name: "post-form-s5: 引用するときは、入力欄の下に引用先の投稿の投稿者名と本文を枠で囲んで表示する",
  play: async ({ canvasElement }) => {
    const dialog = within(await openComposeFromPost(canvasElement, "引用"));
    const quote = dialog.getByRole("blockquote");

    await expect(quote).toHaveTextContent("Alice");
    await expect(quote).toHaveTextContent("こんにちは！今日はいい天気ですね。");
  },
};

export const PostFormReplyRules: Story = {
  name: "post-form-s6: 返信できる人の設定は入力欄の下にある今の設定を示すボタン(「誰でも返信できます」など)を押して選ぶ",
  play: async ({ canvasElement }) => {
    const dialog = within(await openCompose(canvasElement));

    await expect(dialog.queryByRole("radio", { name: "返信不可" })).toBeNull();
    await userEvent.click(
      dialog.getByRole("button", { name: "誰でも返信できます" }),
    );
    await userEvent.click(dialog.getByRole("radio", { name: "返信不可" }));
    await expect(
      dialog.getByRole("button", { name: "返信不可" }),
    ).toBeVisible();
  },
};

export const PostFormReplyHidesRules: Story = {
  name: "post-form-s7: 返信するときは、返信できる人の設定を表示しない",
  play: async ({ canvasElement }) => {
    const dialog = within(await openComposeFromPost(canvasElement, "返信"));

    await expect(dialog.getByRole("button", { name: /^返信$/ })).toBeVisible();
    await expect(
      dialog.queryByRole("button", { name: "誰でも返信できます" }),
    ).toBeNull();
  },
};

export const PostFormMobile: Story = {
  name: "post-form-s8: モバイルでは、ソフトウェアキーボードで入力欄が隠れないよう、投稿欄を画面の上寄せで開く",
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    await openCompose(canvasElement);

    await expect(
      within(canvasElement)
        .getByRole("dialog", { name: "新規投稿" })
        .getBoundingClientRect().y,
    ).toBeLessThan(50);
  },
};

export const PostFormAltBadge: Story = {
  name: "post-form-s9: 添付した画像には、ALTが未入力なら「+ ALT」、入力済みなら「ALT」のバッジを重ね、押すとその画像のALTを入力するダイアログを開く",
  play: async ({ canvasElement }) => {
    const dialogElement = await openCompose(canvasElement);
    const dialog = within(dialogElement);
    await addImages(dialogElement, 2);
    const badge = (n: number) =>
      dialog.getByRole("button", { name: `画像${n}のALTを編集` });
    await expect(badge(1)).toHaveTextContent("+ ALT");

    await writeAlt(dialogElement, 1, "post-form-s9");

    await expect(badge(1)).toHaveTextContent(/^ALT$/);
    await expect(badge(2)).toHaveTextContent("+ ALT");
    await userEvent.click(badge(1));
    await expect(
      dialog
        .getByRole("dialog", { name: "ALTを追加" })
        .querySelector("textarea, input"),
    ).toHaveValue("post-form-s9");
  },
};

export const PostFormAltLimit: Story = {
  name: "post-form-s10: ALTは2000字を超えると保存できない",
  play: async ({ canvasElement }) => {
    const dialogElement = await openCompose(canvasElement);
    const dialog = within(dialogElement);
    await addImages(dialogElement, 1);
    await userEvent.click(
      dialog.getByRole("button", { name: "画像1のALTを編集" }),
    );
    const altDialog = within(
      await dialog.findByRole("dialog", { name: "ALTを追加" }),
    );
    const textbox = altDialog.getByRole("textbox", { name: "ALT" });
    const done = altDialog.getByRole("button", { name: "完了" });

    await userEvent.click(textbox);
    await userEvent.paste("あ".repeat(2000));
    await expect(done).toBeEnabled();
    await userEvent.type(textbox, "あ");
    await expect(done).toBeDisabled();
  },
};

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
  name: "timeline-s7: リポストした人の表示は投稿者のアイコンより上の行に出す",
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
  name: "timeline-s8: 投稿には投稿者の名前の隣にハンドルを表示する",
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
  name: "timeline-s9: 「○○がリポスト」をタップすると、○○のプロフィール全体ページを開く",
  beforeEach: reposted,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "Charlieがリポスト" }),
    ).toHaveAttribute("href", "/charlie.bsky.social");
  },
};

export const Hashtag: Story = {
  name: "timeline-s10: 本文のうちfacetsでハッシュタグが付いた範囲は、そのハッシュタグを投稿タブで検索する検索ページ（`/search?q=%23タグ`）へのリンクにする",
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
  name: "timeline-s11: 線で繋げた投稿が4件以上ある場合は、起点・最後の投稿の返信先・最後の投稿の3件だけを表示し、起点と返信先の間に省略した投稿の件数を、リンクと分かる見た目で点線つきで表示する。この表示は最後の投稿のスレッドページへのリンクにする",
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
