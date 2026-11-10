import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as threadLoader } from "@/app/routes/api.thread";

import { ThreadPage } from "./thread-page";

const meta = {
  beforeEach: () => {
    const post = (uri: string, text: string) => ({
      uri,
      cid: "bafyexample",
      authorDisplayName: "Alice",
      authorHandle: alice.handle,
      text,
      createdAt: new Date().toISOString(),
    });
    queryClient.setQueryData<Data<typeof threadLoader>>(
      ["thread", alice.handle, "selected"],
      {
        ancestors: [post("at://a/1", "親投稿です")],
        post: {
          ...post("at://a/2", "選んだ投稿です"),
          replyCount: 1,
          repostCount: 1,
          likeCount: 8,
        },
        replies: [
          [post("at://a/3", "返信です"), post("at://a/4", "返信への返信です")],
        ],
      },
    );
  },
  component: ThreadPage,
  parameters: {
    path: "/alice.bsky.social/post/selected",
    layout: "fullscreen",
  },
  args: {
    handle: "alice.bsky.social",
    rkey: "selected",
  },
} satisfies Meta<typeof ThreadPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoReplies: Story = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof threadLoader>>(
      ["thread", alice.handle, "selected"],
      {
        ancestors: [],
        post: {
          uri: "at://a/2",
          cid: "bafyexample",
          authorDisplayName: alice.displayName,
          authorHandle: alice.handle,
          text: "選んだ投稿です",
          createdAt: new Date().toISOString(),
          replyCount: 0,
          repostCount: 0,
          likeCount: 0,
        },
        replies: [],
      },
    );
  },
};

export const FocusedPost: Story = {
  name: "thread-s1: 選んだ投稿は本文を大きくし、投稿日時と返信・リポスト・いいねの件数を表示する",
  tags: ["play"],
  play: async ({ canvasElement }) => {
    const focused = within(canvasElement).getByRole("article", {
      name: "選んだ投稿",
    });

    await expect(within(focused).getByText("選んだ投稿です")).toHaveStyle({
      fontSize: "18px",
    });
    await expect(focused.querySelector("time")).toHaveTextContent(
      /\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}/,
    );
    await expect(
      within(focused).getByText("件の返信", { exact: false }),
    ).toBeVisible();
    await expect(
      within(focused).getByText("件のリポスト", { exact: false }),
    ).toBeVisible();
    await expect(
      within(focused).getByText("件のいいね", { exact: false }),
    ).toBeVisible();
  },
};

export const Toolbars: Story = {
  name: "thread-s2: スレッドの投稿にも投稿のツールバーを表示する",
  tags: ["play"],
  play: async ({ canvasElement }) => {
    const articles = within(canvasElement).getAllByRole("article");

    await expect(articles).toHaveLength(4);
    for (const article of articles) {
      await expect(
        within(article).getByRole("button", { name: "いいね" }),
      ).toBeVisible();
    }
  },
};

export const Loading: Story = {
  name: "thread-s3: スレッドを開くと、投稿の読み込みを待たずに画面を表示し、読み込み終えるまで選んだ投稿・返信を書く欄・返信の場所の形のスケルトンを表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["thread", alice.handle] });
    void queryClient.query({
      queryKey: ["thread", alice.handle, "selected"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("status", {
        name: "読み込み中",
        exact: true,
      }),
    ).toBeVisible();
  },
};
