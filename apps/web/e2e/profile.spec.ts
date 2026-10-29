import { expect, test } from "@playwright/test";

import { login } from "./login";

test.describe("プロフィール", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL("/");
    await page.goto("/?profile=alice.test");
  });

  test("profile-2: URLの ?profile=ハンドル で、右カラムにそのユーザーのプロフィールの簡易表示が開く", async ({
    page,
  }) => {
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(panel.getByText("@alice.test")).toBeVisible();
    await expect(panel.getByText("フォロワー")).toBeVisible();
  });

  test("profile-3: 簡易表示を閉じると、右カラムが通知に戻る", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "閉じる" }).click();

    await expect(page.getByRole("heading", { name: "通知" })).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("profile-4: 簡易表示から、中央カラムのプロフィール全体ページに移動できる", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "プロフィール全体を見る" }).click();

    await expect(page).toHaveURL("/profile/alice.test");
  });
});
