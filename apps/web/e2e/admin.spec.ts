import { expect, type Page, test } from "@playwright/test";

import { login } from "./login";

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
    await page.goto("/admin/subscribers");

    const row = page.getByRole("row", { name: "@alice.test" });
    await expect(row).toBeVisible();
    await expect(row.getByText("管理者")).toBeVisible();
  });
});

test.describe("招待コード", () => {
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

    await expect(page.getByRole("row").first()).toHaveText(
      /コード\s*ステータス\s*使用者\s*有効期限\s*作成日/,
    );
    await expect(page.getByRole("row").nth(1)).toContainText(newer);
    await expect(page.getByRole("row").nth(1)).toContainText("未使用");
    await expect(page.getByRole("row").nth(2)).toContainText(older);
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

    await page.getByRole("row").last().scrollIntoViewIfNeeded();

    await expect(page.getByText(oldest)).toBeVisible();
  });
});
