import type { $OutputBody as BannedAccountsResponse } from "@repo/client/me/subsco/admin/getBannedAccounts";
import type { $OutputBody as ServerMembersResponse } from "@repo/client/me/subsco/admin/listServerMembers";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, queryClient } from "@/.storybook/query-client";
import { ServerMemberListContainer } from "@/app/features/admin/server-member-list-container";

import { AdminPage } from "./admin-page";

const meta = {
  component: AdminPage,
  parameters: {
    path: "/admin/registered-accounts",
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ServerMembers: Story = {
  beforeEach: () => {
    queryClient.setQueryData(["serverMembers"], {
      pages: [
        {
          serverMembers: [
            {
              profile: alice,
              isAdmin: true,
              registeredAt: "2024-01-01T00:00:00.000Z",
              backfillStatus: "completed",
            },
            {
              profile: bob,
              isAdmin: false,
              registeredAt: "2024-01-02T00:00:00.000Z",
              backfillStatus: "inProgress",
            },
          ],
          total: 2,
        } satisfies ServerMembersResponse,
      ],
      pageParams: [undefined],
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
};

const serverMembersData = (
  backfillStatus: string,
  ...profiles: (typeof alice | typeof bob)[]
) => ({
  pages: [
    {
      serverMembers: profiles.map((profile) => ({
        profile,
        isAdmin: false,
        registeredAt: "2024-01-01T00:00:00.000Z",
        backfillStatus,
      })),
      total: profiles.length,
    } satisfies ServerMembersResponse,
  ],
  pageParams: [undefined],
});

export const MemberCount: Story = {
  name: "adminAccounts-s1: 見出しの横にメンバーの人数を出す",
  beforeEach: () => {
    queryClient.setQueryData(
      ["serverMembers"],
      serverMembersData("completed", alice, bob),
    );
  },
  args: {
    children: <ServerMemberListContainer />,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("2人")).toBeVisible();
  },
};

export const BannedAccounts: Story = {
  name: "adminAccounts-s2: 「停止中」タブにはサーバー登録を停止したアカウントを1人1行で並べ、名前・ハンドルを出す",
  parameters: { path: "/admin/registered-accounts?tab=banned" },
  beforeEach: () => {
    queryClient.setQueryData(["bannedAccounts"], {
      pages: [{ actors: [alice, bob] } satisfies BannedAccountsResponse],
      pageParams: [undefined],
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second, ...rest] = within(
      canvas.getByRole("main"),
    ).getAllByRole("listitem");

    await expect(rest).toHaveLength(0);
    await expect(first).toHaveTextContent("Alice@alice.bsky.social");
    await expect(second).toHaveTextContent("Bob@bob.bsky.social");
  },
};

export const BackfillBadges: Story = {
  name: "syncStatus-s1: 追跡アカウントには、過去の投稿の同期状態を「同期中」「同期済み」「同期エラー」のバッジで表示する",
  beforeEach: () => {
    queryClient.setQueryData(["serverMembers"], {
      pages: [
        {
          serverMembers: (
            [
              [alice, "completed"],
              [bob, "inProgress"],
              [
                {
                  ...alice,
                  did: "did:plc:carol",
                  handle: "carol.bsky.social",
                  displayName: "Carol",
                },
                "error",
              ],
            ] as const
          ).map(([profile, backfillStatus]) => ({
            profile,
            isAdmin: false,
            registeredAt: "2024-01-01T00:00:00.000Z",
            backfillStatus,
          })),
          total: 3,
        } satisfies ServerMembersResponse,
      ],
      pageParams: [undefined],
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("同期済み")).toBeVisible();
    await expect(canvas.getByText("同期中")).toBeVisible();
    await expect(canvas.getByText("同期エラー")).toBeVisible();
  },
};

export const ServerMembersLoading: Story = {
  name: "adminAccounts-s4: メンバーの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
  beforeEach: () => {
    void queryClient.query({
      queryKey: ["serverMembers"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "アカウント管理" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};
