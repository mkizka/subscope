import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as meLoader } from "@/app/routes/api.me";

import { SettingsPage } from "./settings-page";

const meta = {
  component: SettingsPage,
  args: { accountUrl: "https://bsky.social/account" },
  parameters: {
    path: "/settings",
    layout: "fullscreen",
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Account: Story = {
  name: "settings-s1: 自分のアイコン、表示名、ハンドルを表示する",
  tags: ["play"],
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
      main.getByRole("heading", { name: "アカウント" }).parentElement!,
    );

    await expect(account.getByText("Alice")).toBeVisible();
    await expect(account.getByText("@alice.bsky.social")).toBeVisible();
    await expect(account.getByTestId("avatar-fallback")).toBeVisible();
  },
};

export const AccountNote: Story = {
  name: "settings-s2: 「アカウント管理」の下に、認可サーバーのホスト名を使って「{ホスト名} で設定できます」と表示する",
  tags: ["play"],
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole("main"));

    await expect(main.getByText("bsky.social で設定できます")).toBeVisible();
  },
};
