import { expect, test } from "@playwright/test";

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
