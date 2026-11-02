import { expect, test } from "@playwright/test";

import { follow, putRecord } from "../../helpers/pds";

test.describe("追跡アカウント", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await page.goto("/");
  });

  test("tracked-accounts-1: 左カラムの「追跡アカウント」から、中央カラムに追跡アカウント（名前、ハンドル、フォローしている登録アカウントの数）を、フォローしている登録アカウントが多い順に一覧表示する", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "追跡アカウント" }).click();

    await expect(page).toHaveURL("/tracked-accounts");
    const items = page.getByRole("main").getByRole("listitem");
    const bob = items.filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(items.filter({ hasText: "Alice" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(bob.getByText(/^@/)).toBeVisible();
    await expect(
      bob.getByText(/^登録アカウント[1-9]\d*人がフォロー$/),
    ).toBeVisible();
    const counts = (
      await items.getByText(/登録アカウントがフォロー$/).allTextContents()
    ).map((text) => parseInt(text.replace("登録アカウント", ""), 10));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  test("tracked-accounts-2: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    await page.goto("/tracked-accounts");

    await page.getByRole("main").getByRole("link", { name: /^Bob/ }).click();

    await expect(page).toHaveURL(/\/profile\/[^/]+$/);
    await expect(
      page.getByRole("main").getByRole("heading", { name: "Bob", exact: true }),
    ).toBeVisible();
  });

  test("tracked-accounts-3: 一覧の上に、追跡アカウントが登録アカウントとそのフォロー先であり、このサーバーはその人たちの投稿だけを保存することを説明する", async ({
    page,
  }) => {
    await page.goto("/tracked-accounts");

    await expect(
      page
        .getByRole("main")
        .getByText(
          "登録アカウントとそのフォロー先です。このサーバーはこの人たちの投稿だけを保存します。",
        ),
    ).toBeVisible();
  });

  test("tracked-accounts-4: 見出しの横に追跡アカウントの人数を出す", async ({
    page,
  }) => {
    await page.goto("/tracked-accounts");

    await expect(page.getByRole("main").getByText(/^\d+人$/)).toBeVisible();
  });

  test("tracked-accounts-5: 一覧のアカウントには、過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    await page.goto("/tracked-accounts");

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
});
