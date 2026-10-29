import { expect, type Page, test } from "@playwright/test";

import { login } from "./login";
import { resolveHandle, subscribeServer } from "./pds";

test.describe("管理画面へのアクセス", () => {
  test("admin-1: 左カラムの「サーバー」に、管理者にだけ「登録ユーザー」「招待コード」「ジョブキュー」を出す", async ({
    page,
  }) => {
    await login(page);

    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "登録ユーザー" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "招待コード" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "ジョブキュー" })).toBeVisible();
  });
});

test.describe("登録ユーザー", () => {
  test("subscribers-1: サブスクライバーを新しい順に並べ、名前・ハンドル・管理者かどうかを出す", async ({
    page,
  }) => {
    await login(page);
    const aliceDid = await resolveHandle("alice.test");

    await page.goto("/admin/subscribers");

    const row = page.getByRole("row").filter({ hasText: aliceDid });
    await expect(row.getByText("管理者")).toBeVisible();
  });

  test("subscribers-3: 管理者でないサブスクライバーを、確認のうえ「管理者にする」で管理者にできる", async ({
    page,
  }) => {
    await login(page);
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await subscribeServer("bob.test", code);
    const bobDid = await resolveHandle("bob.test");

    await page.goto("/admin/subscribers");

    const row = page.getByRole("row").filter({ hasText: bobDid });

    page.once("dialog", (dialog) => void dialog.accept());
    await row.getByRole("button", { name: "管理者にする" }).click();

    await expect(row.getByText("管理者", { exact: true })).toBeVisible();
  });
});

test.describe("招待コード", () => {
  const inviteCodeRows = (page: Page) =>
    page.getByRole("list", { name: "招待コード" }).getByRole("listitem");

  const createInviteCode = async (page: Page) => {
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return ((await response.json()) as { code: string }).code;
  };

  test("invite-codes-1: 招待コードを新しい順に並べ、コード・状態（未使用・使用済み・期限切れ）・使用者・有効期限・作成日を出す", async ({
    page,
  }) => {
    await login(page);
    const older = await createInviteCode(page);
    const newer = await createInviteCode(page);

    await page.goto("/admin/invite-codes");

    const rows = inviteCodeRows(page);
    await expect(rows.nth(0)).toContainText(newer);
    await expect(rows.nth(0)).toContainText("未使用");
    await expect(rows.nth(1)).toContainText(older);
  });

  test("invite-codes-2: 一覧の下までスクロールすると続きを読み込む", async ({
    page,
  }) => {
    await login(page);
    const oldest = await createInviteCode(page);
    for (let i = 0; i < 20; i++) {
      await createInviteCode(page);
    }

    await page.goto("/admin/invite-codes");
    await expect(page.getByText(oldest)).toHaveCount(0);

    await inviteCodeRows(page).last().scrollIntoViewIfNeeded();

    await expect(page.getByText(oldest)).toBeVisible();
  });

  test("invite-codes-3: 「新規作成」で有効期限7日の招待コードを作り、一覧の先頭に出す", async ({
    page,
  }) => {
    await login(page);
    const existing = await createInviteCode(page);
    await page.goto("/admin/invite-codes");
    const firstRow = inviteCodeRows(page).first();
    await expect(firstRow).toContainText(existing);

    await page.getByRole("button", { name: "新規作成" }).click();

    await expect(firstRow).not.toContainText(existing);
    await expect(firstRow).toContainText("未使用");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await expect(firstRow).toContainText(
      expiresAt.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  });

  test("invite-codes-4: 未使用の招待コードだけを削除でき、期限切れでないものは削除前に確認する", async ({
    page,
  }) => {
    await login(page);
    const code = await createInviteCode(page);

    await page.goto("/admin/invite-codes");
    const row = inviteCodeRows(page).filter({ hasText: code });

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain(code);
      void dialog.accept();
    });
    await row.getByRole("button", { name: "削除" }).click();

    await expect(row).toHaveCount(0);
  });
});
