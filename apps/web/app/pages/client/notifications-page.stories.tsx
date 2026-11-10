import { asDatetimeString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
  bob,
  indexedAt as nowIndexedAt,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";

import { NotificationsPage } from "./notifications-page";

const meta = {
  beforeEach: () => {
    const indexedAt = asDatetimeString(new Date().toISOString());
    queryClient.setQueryData(
      ["notifications"],
      infinite<typeof notificationsLoader>({
        notifications: [
          {
            uri: "at://did:plc:bob/app.bsky.feed.like/1",
            cid: "bafylike",
            author: bob,
            reason: "like",
            reasonSubject: "at://did:plc:alice/app.bsky.feed.post/1",
            record: {},
            isRead: false,
            indexedAt,
          },
          {
            uri: "at://did:plc:bob/app.bsky.feed.post/2",
            cid: "bafyreply",
            author: bob,
            reason: "reply",
            record: { text: "いいですね！" },
            isRead: false,
            indexedAt,
          },
          {
            uri: "at://did:plc:bob/app.bsky.graph.follow/1",
            cid: "bafyfollow",
            author: bob,
            reason: "follow",
            record: {},
            isRead: true,
            indexedAt,
          },
        ],
        cursor: undefined,
        subjectTexts: {
          "at://did:plc:alice/app.bsky.feed.post/1": "こんにちは！",
        },
      }),
    );
  },
  component: NotificationsPage,
  parameters: {
    path: "/notifications",
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotificationsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["notifications"],
      infinite<typeof notificationsLoader>({
        notifications: [],
        cursor: undefined,
        subjectTexts: {},
      }),
    );
  },
};

export const UnreadBadge: Story = {
  name: "notification-s1: モバイルでは、未読があるとき下のタブの通知に未読数を表示する",
  tags: ["play"],
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("navigation", {
      name: "タブバー",
    });
    await expect(
      within(within(tab).getByRole("link", { name: "通知" })).getByText("2"),
    ).toBeVisible();
  },
};

const avatarUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";

export const IconAndAvatar: Story = {
  name: "notification-s2: 通知には、種類を表す色付きのアイコンと相手のアバターを表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.setQueryData(
      ["notifications"],
      infinite<typeof notificationsLoader>({
        notifications: [
          {
            uri: "at://did:plc:bob/app.bsky.graph.follow/1",
            cid: "bafyfollow",
            author: { ...bob, avatar: avatarUrl },
            reason: "follow",
            record: {},
            isRead: true,
            indexedAt: nowIndexedAt,
          },
        ],
        cursor: undefined,
        subjectTexts: {},
      }),
    );
  },
  play: async ({ canvasElement }) => {
    const item = within(
      within(canvasElement).getByRole("region", { name: "通知" }),
    ).getByRole("listitem");
    await expect(
      within(item).getByRole("img", { name: "フォロー" }),
    ).toBeVisible();
    await expect(item.querySelector(`img[src="${avatarUrl}"]`)).not.toBeNull();
  },
};

let release: () => void = () => {};

export const Loading: Story = {
  name: "notification-s3: 通知の読み込み中は「通知はまだありません」を表示せず、読み込みが終わって0件のときだけ表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.clear();
    const gate = new Promise<void>((resolve) => (release = resolve));
    void queryClient.infiniteQuery({
      queryKey: ["notifications"],
      queryFn: async () => {
        await gate;
        return { notifications: [], cursor: undefined, subjectTexts: {} };
      },
      initialPageParam: undefined,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
    await expect(canvas.queryByText("通知はまだありません")).toBeNull();

    release();

    await expect(await canvas.findByText("通知はまだありません")).toBeVisible();
  },
};

export const LoadingSkeleton: Story = {
  name: "notification-s4: 通知の読み込み中は、左にアイコン列、右にアバター・文・ハンドル・本文を持つ通知の形のスケルトンを6行表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.clear();
    void queryClient.infiniteQuery({
      queryKey: ["notifications"],
      queryFn: () => new Promise<never>(() => {}),
      initialPageParam: undefined,
    });
  },
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getByRole("status", {
      name: "読み込み中",
    });
    await expect(rows.querySelectorAll(":scope > div")).toHaveLength(6);
  },
};
