import { asDatetimeString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  bob,
  indexedAt as nowIndexedAt,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
import type { PushSettingState } from "@/app/lib/push-setting";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";

import { NotificationsPage } from "./notifications-page";

const pushSetting = (state: PushSettingState) => () => {
  queryClient.setQueryData(["pushSetting"], state);
};

const meta = {
  beforeEach: () => {
    pushSetting("unavailable")();
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
  name: "notification-s2: 通知には種類を表す色付きのアイコンと相手のアバターを表示する",
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

export const PushSettingOff: Story = {
  name: "pushSetting-s1: 受け取らない設定のときは「プッシュ通知はオフです」と「オンにする」ボタンを表示する",
  tags: ["play"],
  beforeEach: pushSetting("off"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("プッシュ通知はオフです")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "オンにする" }),
    ).toBeVisible();
  },
};

export const PushSettingOn: Story = {
  name: "pushSetting-s2: 受け取る設定のときは「プッシュ通知はオンです」と「オフにする」ボタンを表示する",
  tags: ["play"],
  beforeEach: pushSetting("on"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("プッシュ通知はオンです")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "オフにする" }),
    ).toBeVisible();
  },
};

export const PushSettingDenied: Story = {
  name: "pushSetting-s3: ブラウザで通知をブロックしているときは、ボタンを出さず「ブラウザで通知がブロックされています。ブラウザの設定から許可してください」と表示する",
  tags: ["play"],
  beforeEach: pushSetting("denied"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        "ブラウザで通知がブロックされています。ブラウザの設定から許可してください",
      ),
    ).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /にする$/ })).toBeNull();
  },
};

export const PushSettingUnsupported: Story = {
  name: "pushSetting-s4: プッシュ通知に対応していないブラウザでは、ボタンを出さず「このブラウザはプッシュ通知に対応していません。iPhoneとiPadではホーム画面に追加すると使えます」と表示する",
  tags: ["play"],
  beforeEach: pushSetting("unsupported"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        "このブラウザはプッシュ通知に対応していません。iPhoneとiPadではホーム画面に追加すると使えます",
      ),
    ).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /にする$/ })).toBeNull();
  },
};

export const PushSettingToggling: Story = {
  name: "pushSetting-s5: 切り替えている間は、ボタンを押せなくしてスピナーを表示する",
  tags: ["play"],
  beforeEach: () => {
    pushSetting("off")();
    const original = Notification.requestPermission.bind(Notification);
    Notification.requestPermission = () => new Promise(() => {});
    return () => {
      Notification.requestPermission = original;
    };
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "オンにする",
    });

    await userEvent.click(button);

    await expect(button).toBeDisabled();
    await expect(button.querySelector(".animate-spin")).not.toBeNull();
  },
};

export const PushSettingDismissed: Story = {
  name: "pushSetting-s6: 「オンにする」を押して通知の許可ダイアログが選択されずに閉じたときは、「アドレスバーのアイコンから通知を許可してください」と表示する",
  tags: ["play"],
  beforeEach: () => {
    pushSetting("off")();
    const original = Notification.requestPermission.bind(Notification);
    Notification.requestPermission = () => Promise.resolve("default");
    return () => {
      Notification.requestPermission = original;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "オンにする" }));

    await expect(
      await canvas.findByText(
        "アドレスバーのアイコンから通知を許可してください",
      ),
    ).toBeVisible();
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
  name: "notification-s4: 通知の読み込み中は左にアイコン列、右にアバター・文・ハンドル・本文を持つ通知の形のスケルトンを6行表示する",
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
