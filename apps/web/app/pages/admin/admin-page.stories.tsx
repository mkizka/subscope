import type { $OutputBody as ServerMembersResponse } from "@repo/client/me/subsco/admin/listServerMembers";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { alice, bob, queryClient } from "@/.storybook/query-client";
import { ServerMemberListContainer } from "@/app/features/admin/server-member-list-container";

import { AdminPage } from "./admin-page";

const meta = {
  component: AdminPage,
  parameters: {
    path: "/admin/server-members",
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

export const AddMemberDialog: Story = {
  name: "adminAccounts-s3: 見出しの横の「メンバーを追加」で、ハンドルかDIDを入力するダイアログを開く",
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
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "メンバーを追加" }),
    );

    const dialog = canvas.getByRole("dialog", { name: "メンバーを追加" });
    await expect(dialog).toBeVisible();
    await expect(
      within(dialog).getByRole("textbox", { name: "ハンドルまたはDID" }),
    ).toBeVisible();
  },
};

export const ProfileLinks: Story = {
  name: "adminAccounts-s4: メンバーは、アバターや名前を押すとそのアカウントのプロフィールを開く",
  beforeEach: () => {
    queryClient.setQueryData(
      ["serverMembers"],
      serverMembersData("completed", alice),
    );
  },
  args: {
    children: <ServerMemberListContainer />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = within(canvas.getByRole("main"));

    await expect(main.getByRole("link", { name: /Alice/ })).toHaveAttribute(
      "href",
      "/alice.bsky.social",
    );
  },
};

export const BackfillBadges: Story = {
  name: "syncStatus-s1: メンバーには、過去の投稿の同期状態を「同期中」「同期済み」「同期エラー」のバッジで表示する",
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
  beforeEach: () => {
    void queryClient.query({
      queryKey: ["serverMembers"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  args: {
    children: <ServerMemberListContainer />,
  },
};
