import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

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
