import { expect, test } from "@playwright/test";

import { putRecord } from "../../helpers/pds";

test.describe("登録アカウント", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "Blueskyを使っています",
    });
    await page.goto("/");
  });

  test("registered-accounts-1: 左カラムの「登録アカウント」から、中央カラムに登録アカウント（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page
      .getByRole("link", { name: "登録アカウント", exact: true })
      .click();

    await expect(page).toHaveURL("/registered-accounts");
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice.getByText("Blueskyを使っています")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(alice.getByText(/^@/)).toBeVisible();
  });

  test("registered-accounts-2: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    await page.goto("/registered-accounts");

    await page
      .getByRole("main")
      .getByRole("link", { name: /^Alice/ })
      .click();

    await expect(page).toHaveURL(/\/profile\/[^/]+$/);
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("registered-accounts-3: 見出しに登録アカウントの人数を表示する", async ({
    page,
  }) => {
    await page.goto("/registered-accounts");

    await expect(
      page.getByRole("heading", { name: /^登録アカウント \d+人$/ }),
    ).toBeVisible();
  });

  test("registered-accounts-4: 管理者の登録アカウントには「管理者」バッジを表示する", async ({
    page,
  }) => {
    await page.goto("/registered-accounts");

    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(alice.getByText("管理者")).toBeVisible();
  });

  test("registered-accounts-5: 一覧の登録アカウントには、過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    await page.goto("/registered-accounts");

    const item = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(item.getByText("同期済み", { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("registered-accounts-6: 登録アカウントの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスピナーを表示する", async ({
    page,
  }) => {
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/api/registered-accounts", async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("link", { name: "登録アカウント", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "登録アカウント" }),
    ).toBeVisible();
    const spinner = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(spinner).toBeVisible();
    release(undefined);
    await expect(spinner).toBeHidden();
  });
});
