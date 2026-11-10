import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { type Data, infinite, queryClient } from "@/.storybook/query-client";
import { ComposeProvider } from "@/app/features/post/post-form-container";
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
  play: async ({ canvasElement }) => {
    const dialog = within(await openCompose(canvasElement));

    await expect(dialog.getByText("@alice.bsky.social")).toBeVisible();
  },
};

export const PostFormReply: Story = {
  name: "post-form-s4: 返信するときは、自分の名前の上に返信先の投稿の投稿者名・ハンドル・本文を表示し、投稿ボタンを「返信」にする",
  tags: ["play"],
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
  tags: ["play"],
  play: async ({ canvasElement }) => {
    const dialog = within(await openComposeFromPost(canvasElement, "引用"));
    const quote = dialog.getByRole("blockquote");

    await expect(quote).toHaveTextContent("Alice");
    await expect(quote).toHaveTextContent("こんにちは！今日はいい天気ですね。");
  },
};

export const PostFormReplyRules: Story = {
  name: "post-form-s6: 返信できる人の設定は、入力欄の下にある今の設定を示すボタン(「誰でも返信できます」など)を押して選ぶ",
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
  tags: ["play"],
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
