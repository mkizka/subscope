import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { infinite, queryClient } from "@/.storybook/query-client";
import { ComposeProvider } from "@/app/features/post/post-form-container";
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
