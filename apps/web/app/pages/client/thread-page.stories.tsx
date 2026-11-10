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

export const QuotedFeed: Story = {
  name: "quote-s9: スレッドで選んだ投稿がフィードジェネレーターを引用している場合も、quote-s7と同じ枠を表示する",
  tags: ["play"],
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
          quotedFeed: {
            displayName: "フィード名",
            creatorHandle: alice.handle,
            description: "フィードの説明",
          },
        },
        replies: [],
      },
    );
  },
  play: async ({ canvasElement }) => {
    const quote = within(canvasElement).getByRole("blockquote");
    await expect(quote).toHaveTextContent("フィード名");
    await expect(quote).toHaveTextContent("@alice.bsky.social");
    await expect(quote).toHaveTextContent("フィードの説明");
  },
};
