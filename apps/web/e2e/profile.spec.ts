import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord, putRecord } from "./pds";

test.describe("プロフィール", () => {
  test("profile-1: 左カラムの「プロフィール」から、中央カラムに自分のプロフィール（名前、ハンドル、フォロー数、フォロワー数、投稿一覧）を表示する", async ({
    page,
  }) => {
    const text = `profile-1の投稿 ${Date.now()}`;
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await login(page);

    await page.getByRole("link", { name: "プロフィール" }).click();

    await expect(page).toHaveURL(/\/profile\//);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Alice" })).toBeVisible();
    await expect(main.getByText(/^@/).first()).toBeVisible();
    await expect(main.getByText(/^\d+ フォロー$/)).toBeVisible();
    await expect(main.getByText(/^\d+ フォロワー$/)).toBeVisible();
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test.describe("簡易表示", () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto("/?profile=alice.test");
    });

    test("profile-2: URLに ?profile=ハンドル があると、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
      page,
    }) => {
      const panel = page.getByRole("region", { name: "プロフィール" });
      await expect(panel.getByText("@alice.test")).toBeVisible();
      await expect(panel.getByText("フォロワー")).toBeVisible();
    });

    test("profile-3: 簡易表示を閉じると、右カラムを通知に戻す", async ({
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
});
