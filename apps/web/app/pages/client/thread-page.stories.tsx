import type { Meta, StoryObj } from "@storybook/react-vite";

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
