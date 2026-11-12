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

  test("server-e1: 項目「運営者」に、最初に管理者になった1人のアイコンと名前を表示し、選ぶとそのアカウントのプロフィール全体ページに移動する", async ({
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

  test("server-e2: 項目「サーバーDID」に、サーバーDID `did:web:{ホスト}#bsky_appview` を表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    await expect(page.getByText("サーバーDID", { exact: true })).toBeVisible();
    await expect(page.getByText(/^did:web:.+#bsky_appview$/)).toBeVisible();
  });

  test("server-e3: サーバーDIDの文字列とコピーアイコンをひとつのボタンにし、押すとサーバーDIDをクリップボードにコピーできる", async ({
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

  test("server-e4: 「誰かがフォロー」タブでは、フォローされているアカウント（名前、ハンドル）を、フォローしているメンバーが多い順に一覧表示する", async ({
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

  test("server-e5: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
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

  test("server-e6: 旧URLは`/server` の該当タブへ移動する", async ({ page }) => {
    await page.goto("/server/accounts?tab=tracked");
    await expect(page).toHaveURL("/server?tab=tracked");

    await page.goto("/accounts?tab=tracked");
    await expect(page).toHaveURL("/server?tab=tracked");

    await page.goto("/registered-accounts");
    await expect(page).toHaveURL("/server");

    await page.goto("/tracked-accounts");
    await expect(page).toHaveURL("/server?tab=tracked");
  });

  test("server-e7: タブの下の検索欄に入力すると、選んでいるタブの全件から表示名・ハンドルの部分一致で絞り込み、検索語を `?q=` に入れる", async ({
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
