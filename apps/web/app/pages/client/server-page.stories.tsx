import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as registeredLoader } from "@/app/routes/api.registered-accounts";
import type { loader as trackedLoader } from "@/app/routes/api.tracked-accounts";

import { ServerPage } from "./server-page";

const meta = {
  component: ServerPage,
  parameters: {
    path: "/server",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ServerPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const About: Story = {
  name: "server-s1: 「サーバーについて」の下に、Subscopeの概要と「仕組み」「Subscopeが目指すもの」を表示する",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "サーバーについて" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。",
      ),
    ).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "仕組み" })).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "Subscopeが目指すもの" }),
    ).toBeVisible();
  },
};

export const TabCounts: Story = {
  name: "server-s2: タブの見出しに、それぞれの人数を出す",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "メンバー 2" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "誰かがフォロー 3" }),
    ).toBeVisible();
  },
};

export const MemberDetails: Story = {
  name: "server-s3: 「メンバー」タブでは、メンバーを自己紹介つきで一覧表示する",
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof registeredLoader>>(
      ["clientServerMembers", ""],
      {
        serverMembers: [
          { ...alice, isAdmin: false, description: "Blueskyを使っています" },
        ],
        hasMore: false,
      },
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(within(canvasElement).getByRole("main"));
    await expect(canvas.getByText("Alice")).toBeVisible();
    await expect(canvas.getByText("@alice.bsky.social")).toBeVisible();
    await expect(canvas.getByText("Blueskyを使っています")).toBeVisible();
  },
};

export const OperatorBadge: Story = {
  name: "server-s4: 管理者には「運営者」ラベルを表示する",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("運営者", { selector: "li *" }),
    ).toBeVisible();
  },
};

export const FollowerCount: Story = {
  name: "server-s6: 「誰かがフォロー」タブでは、フォローしているメンバーの数を「n人からフォロー」と表示する",
  parameters: { path: "/server?tab=tracked" },
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof trackedLoader>>(
      ["trackedAccounts", ""],
      {
        total: 1,
        accounts: [{ ...bob, registeredFollowersCount: 3 }],
      },
    );
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("3人からフォロー"),
    ).toBeVisible();
  },
};

export const AccountsLoading: Story = {
  beforeEach: () => {
    for (const key of ["clientServerMembers", "trackedAccounts"]) {
      queryClient.removeQueries({ queryKey: [key] });
      void queryClient
        .query({
          queryKey: [key, ""],
          queryFn: () => new Promise<never>(() => {}),
        })
        .catch(() => {});
    }
  },
};

export const NoSearchResult: Story = {
  name: "server-s8: 絞り込みに一致するアカウントがないときは「アカウントが見つかりません」と表示する",
  parameters: { path: "/server?q=zzzzzz" },
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof registeredLoader>>(
      ["clientServerMembers", "zzzzzz"],
      { serverMembers: [], hasMore: false },
    );
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("アカウントが見つかりません"),
    ).toBeVisible();
  },
};

export const ServerInfoLoading: Story = {
  name: "server-s9: 運営者とサーバーDIDは、読み込み中にスケルトンを表示する",
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["server"] });
    void queryClient
      .query({
        queryKey: ["server"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("status", { name: "運営者を読み込み中" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "サーバーDIDを読み込み中" }),
    ).toBeVisible();
  },
};
