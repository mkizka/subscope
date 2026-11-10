import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { infinite, queryClient } from "@/.storybook/query-client";
import type { loader as inviteCodesLoader } from "@/app/routes/admin.api.invite-codes";

import { AdminPage } from "./admin-page";
import { InviteCodesPage } from "./invite-codes-page";

const meta = {
  component: InviteCodesPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AdminPage>
        <Story />
      </AdminPage>
    ),
  ],
} satisfies Meta<typeof InviteCodesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["inviteCodes"],
      infinite<typeof inviteCodesLoader>({
        codes: [
          {
            code: "abc-123-def",
            expiresAt: "2099-12-31T23:59:59.000Z",
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
  },
};

const setCodes = (codes: InviteCode[]) =>
  queryClient.setQueryData(
    ["inviteCodes"],
    infinite<typeof inviteCodesLoader>({ codes }),
  );

export const Used: Story = {
  name: "invite-codes-s1: 使用済みの招待コードは削除できない",
  tags: ["play"],
  beforeEach: () => {
    setCodes([
      {
        code: "used-code",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
        usedAt: "2025-01-15T10:00:00.000Z",
        usedBy: { did: "did:plc:erin", handle: "erin.test" },
      },
    ]);
  },
  play: async ({ canvasElement }) => {
    const row = within(
      within(canvasElement).getByRole("list", { name: "招待コード" }),
    ).getByRole("listitem");
    await expect(row).toHaveTextContent("使用済み");
    await expect(within(row).queryByRole("button")).toBeNull();
  },
};

export const Copy: Story = {
  name: "invite-codes-s2: 未使用で期限内の招待コードは、コードの横のボタンでコードをクリップボードにコピーできる",
  tags: ["play"],
  beforeEach: () => {
    setCodes([
      {
        code: "abc-123-def",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ]);
  },
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();

    await user.click(
      within(canvasElement).getByRole("button", { name: "コピー" }),
    );

    await expect(await navigator.clipboard.readText()).toBe("abc-123-def");
  },
};

export const UsedBy: Story = {
  name: "invite-codes-s3: 使用済みの招待コードには、使用者のアバターと名前を出す",
  tags: ["play"],
  beforeEach: () => {
    setCodes([
      {
        code: "used-code",
        expiresAt: "2099-12-31T23:59:59.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
        usedAt: "2025-01-15T10:00:00.000Z",
        usedBy: {
          did: "did:plc:erin",
          handle: "erin.test",
          displayName: "Erin",
          avatar: "https://placehold.co/32",
        },
      },
    ]);
  },
  play: async ({ canvasElement }) => {
    const row = within(
      within(canvasElement).getByRole("list", { name: "招待コード" }),
    ).getByRole("listitem");
    await expect(row).toHaveTextContent("Erin が使用");
    await expect(row.querySelector("img")).not.toBeNull();
  },
};

export const Loading: Story = {
  name: "invite-codes-s4: 招待コードの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["inviteCodes"] });
    void queryClient.query({
      queryKey: ["inviteCodes"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "招待コード" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};
