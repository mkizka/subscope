import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import type { PushSettingState } from "@/app/lib/push-setting";
import type { loader as meLoader } from "@/app/routes/api.me";

import { SettingsPage } from "./settings-page";

const pushSetting = (state: PushSettingState) => () => {
  queryClient.setQueryData(["pushSetting"], state);
};

const meta = {
  beforeEach: pushSetting("unavailable"),
  component: SettingsPage,
  args: { accountUrl: "https://bsky.social/account" },
  parameters: {
    path: "/settings",
    layout: "fullscreen",
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { beforeEach: pushSetting("off") };

export const PushOn: Story = { beforeEach: pushSetting("on") };

export const PushDenied: Story = { beforeEach: pushSetting("denied") };

export const PushUnsupported: Story = {
  beforeEach: pushSetting("unsupported"),
};

function OpenPopover({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.querySelector<HTMLElement>("[popover]")?.showPopover();
  }, []);

  return children;
}

const withOpenPopover: Decorator = (Story) => (
  <OpenPopover>
    <Story />
  </OpenPopover>
);

export const PushDeniedHelp: Story = {
  beforeEach: pushSetting("denied"),
  decorators: [withOpenPopover],
};

export const PushUnsupportedHelp: Story = {
  beforeEach: pushSetting("unsupported"),
  decorators: [withOpenPopover],
};

export const Account: Story = {
  name: "settings-s1: 自分のアイコン、表示名、ハンドルを表示する",
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof meLoader>>(["me"], {
      did: alice.did,
      avatarUrl: undefined,
      displayName: alice.displayName,
      handle: alice.handle,
      isAdmin: true,
    });
  },
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole("main"));
    const account = within(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      main.getByText("Alice").parentElement!.parentElement!,
    );

    await expect(account.getByText("Alice")).toBeVisible();
    await expect(account.getByText("@alice.bsky.social")).toBeVisible();
    await expect(account.getByTestId("avatar-fallback")).toBeVisible();
  },
};

export const AccountNote: Story = {
  name: "settings-s2: 「アカウント設定」の下に、認可サーバーのホスト名を使って「{ホスト名} で設定できます」と表示する",
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole("main"));

    await expect(main.getByText("bsky.social で設定できます")).toBeVisible();
  },
};

const pushSwitch = (canvasElement: HTMLElement) =>
  within(canvasElement).findByRole("switch", { name: "プッシュ通知" });

export const PushSettingOff: Story = {
  name: "pushSetting-s1: 受け取らない設定のときは、スイッチをオフにする。説明文は表示しない",
  beforeEach: pushSetting("off"),
  play: async ({ canvasElement }) => {
    await expect(await pushSwitch(canvasElement)).not.toBeChecked();
    await expect(
      within(canvasElement).queryByText(/届けます|許可|使えます/),
    ).toBeNull();
  },
};

export const PushSettingOn: Story = {
  name: "pushSetting-s2: 受け取る設定のときは、スイッチをオンにする。説明文は表示しない",
  beforeEach: pushSetting("on"),
  play: async ({ canvasElement }) => {
    await expect(await pushSwitch(canvasElement)).toBeChecked();
    await expect(
      within(canvasElement).queryByText(/届けます|許可|使えます/),
    ).toBeNull();
  },
};

const helpTexts = {
  denied: "ブラウザのサイト設定で、このサイトの通知を許可すると使えます。",
  unsupported:
    "iPhone・iPadでは、このサイトをホーム画面に追加して開くと使えます。",
};

export const PushSettingDenied: Story = {
  name: "pushSetting-s3: ブラウザで通知をブロックしているときは、スイッチの代わりに行の右端へ「ブロック中」を表示する。押すと、ラベルの下に「ブラウザのサイト設定で、このサイトの通知を許可すると使えます。」を吹き出しで表示する",
  beforeEach: pushSetting("denied"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const help = await canvas.findByText(helpTexts.denied);
    await expect(canvas.queryByRole("switch")).toBeNull();
    await expect(help).not.toBeVisible();

    await userEvent.click(
      await canvas.findByRole("button", { name: "ブロック中" }),
    );
    await expect(help).toBeVisible();
  },
};

export const PushSettingUnsupported: Story = {
  name: "pushSetting-s4: プッシュ通知に対応していないブラウザでは、スイッチの代わりに行の右端へ「非対応」を表示する。押すと、「iPhone・iPadでは、このサイトをホーム画面に追加して開くと使えます。」を吹き出しで表示する",
  beforeEach: pushSetting("unsupported"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const help = await canvas.findByText(helpTexts.unsupported);
    await expect(canvas.queryByRole("switch")).toBeNull();
    await expect(help).not.toBeVisible();

    await userEvent.click(
      await canvas.findByRole("button", { name: "非対応" }),
    );
    await expect(help).toBeVisible();
  },
};

const pendingPermission = () => {
  const original = Notification.requestPermission.bind(Notification);
  return {
    mock: (result?: NotificationPermission) => {
      Notification.requestPermission = () =>
        result ? Promise.resolve(result) : new Promise(() => {});
    },
    restore: () => {
      Notification.requestPermission = original;
    },
  };
};

export const PushSettingToggling: Story = {
  name: "pushSetting-s5: 切り替えている間は、スイッチを無効にして横にスピナーを表示する",
  beforeEach: () => {
    pushSetting("off")();
    const permission = pendingPermission();
    permission.mock();
    return permission.restore;
  },
  play: async ({ canvasElement }) => {
    const toggle = await pushSwitch(canvasElement);

    await userEvent.click(toggle);

    await expect(toggle).toBeDisabled();
    await expect(canvasElement.querySelector(".animate-spin")).not.toBeNull();
  },
};

export const PushSettingDismissed: Story = {
  name: "pushSetting-s6: スイッチをオンにして通知の許可ダイアログが選択されずに閉じたときは、何も表示せずスイッチをオフのままにする",
  beforeEach: () => {
    pushSetting("off")();
    const permission = pendingPermission();
    permission.mock("default");
    return permission.restore;
  },
  play: async ({ canvasElement }) => {
    const toggle = await pushSwitch(canvasElement);

    await userEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeEnabled());
    await expect(toggle).not.toBeChecked();
    await expect(canvasElement.querySelector("[popover]")).toBeNull();
  },
};

export const PushSettingUnavailable: Story = {
  name: "pushSetting-s7: サーバーにVAPID鍵が設定されていないときは、「通知」のセクションを表示しない",
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("heading", { name: "アカウント" });

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("heading", { name: "通知" }),
      ).toBeNull(),
    );
  },
};
