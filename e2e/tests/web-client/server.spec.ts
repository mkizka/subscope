import { expect, type Page, test } from "@playwright/test";

import { follow, putRecord } from "../../helpers/pds";

test.describe("サーバー", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "Blueskyを使っています",
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await page.goto("/");
  });

  const items = (page: Page) => page.getByRole("main").getByRole("listitem");

  test("server-e1: 「運営者」に最初の管理者を表示し、選ぶとそのプロフィールに移動する", async ({
    page,
  }) => {
    await page.goto("/server");

    await page
      .getByRole("main")
      .getByRole("term")
      .filter({ hasText: "運営者" })
      .locator("xpath=following-sibling::dd")
      .getByRole("link", { name: "Alice" })
      .click();

    await expect(page).toHaveURL(/\/alice\.test$/);
  });

  test("server-e2: 「サーバーDID」に、did:web:ホスト名#bsky_appview の形のサーバーDIDを表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    await expect(page.getByText("サーバーDID", { exact: true })).toBeVisible();
    await expect(page.getByText(/^did:web:.+#bsky_appview$/)).toBeVisible();
  });

  test("server-e3: サーバーDIDを押すと、クリップボードにコピーする", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/server");
    const did = await page.getByText(/^did:web:.+#bsky_appview$/).textContent();

    await page.getByRole("button", { name: "サーバーDIDをコピー" }).click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(did);
  });

  test("server-e4: 「誰かがフォロー」タブでは、フォローしているメンバーが多い順にアカウントを一覧表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    await page.getByRole("tab", { name: /^誰かがフォロー/ }).click();

    await expect(page).toHaveURL("/server?tab=tracked");
    const bob = items(page).filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(bob).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(bob.getByText(/^@/)).toBeVisible();
    const counts = (
      await items(page)
        .getByText(/人からフォロー$/)
        .allTextContents()
    ).map((text) => parseInt(text, 10));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  test("server-e5: 一覧のアカウントを選ぶと、そのアカウントのプロフィールに移動する", async ({
    page,
  }) => {
    await page.goto("/server");

    await items(page)
      .getByRole("link", { name: /^Alice/ })
      .click();

    await expect(page).toHaveURL(/\/alice\.test$/);
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("server-e6: 旧URLの `/server/accounts`、`/accounts`、`/registered-accounts`、`/tracked-accounts` は `/server` の該当タブに移動する", async ({
    page,
  }) => {
    await page.goto("/server/accounts?tab=tracked");
    await expect(page).toHaveURL("/server?tab=tracked");

    await page.goto("/accounts?tab=tracked");
    await expect(page).toHaveURL("/server?tab=tracked");

    await page.goto("/registered-accounts");
    await expect(page).toHaveURL("/server");

    await page.goto("/tracked-accounts");
    await expect(page).toHaveURL("/server?tab=tracked");
  });

  test("server-e7: 検索欄に入力すると、選んでいるタブの全件を表示名かハンドルの部分一致で絞り込み、検索語をURLに入れる", async ({
    page,
  }) => {
    await page.goto("/server?tab=tracked");
    await expect(items(page).filter({ hasText: "Bob" })).toBeVisible();

    await page.getByPlaceholder("名前・ハンドルで検索").fill("bob");

    await expect(page).toHaveURL("/server?tab=tracked&q=bob");
    await expect(items(page).filter({ hasText: "Bob" })).toBeVisible();

    await page.getByPlaceholder("名前・ハンドルで検索").fill("alice");

    await expect(page).toHaveURL("/server?tab=tracked&q=alice");
    await expect(items(page).filter({ hasText: "Bob" })).toBeHidden();
  });
});
