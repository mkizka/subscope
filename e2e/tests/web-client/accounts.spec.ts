import { expect, type Page, test } from "@playwright/test";

import { follow, putRecord } from "../../helpers/pds";

test.describe("アカウント", () => {
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

  test("accounts-1: 左カラムの「アカウント」から、中央カラムに登録アカウントの一覧（名前、ハンドル、自己紹介）を表示する", async ({
    page,
  }) => {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "アカウント", exact: true })
      .click();

    await expect(page).toHaveURL("/accounts");
    const alice = items(page).filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice.getByText("Blueskyを使っています")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(alice.getByText(/^@/)).toBeVisible();
  });

  test("accounts-2: 「追跡アカウント」タブを選ぶと、追跡アカウント（名前、ハンドル）を、フォローしている登録アカウントが多い順に一覧表示する", async ({
    page,
  }) => {
    await page.goto("/accounts");

    await page.getByRole("tab", { name: /^追跡アカウント/ }).click();

    await expect(page).toHaveURL("/accounts?tab=tracked");
    const bob = items(page).filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(items(page).filter({ hasText: "Alice" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(bob.getByText(/^@/)).toBeVisible();
    const counts = (
      await items(page)
        .getByText(/人からフォロー$/)
        .allTextContents()
    ).map((text) => parseInt(text, 10));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  test("accounts-3: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    await page.goto("/accounts");

    await page
      .getByRole("main")
      .getByRole("link", { name: /^Alice/ })
      .click();

    await expect(page).toHaveURL(/\/alice\.test$/);
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("accounts-4: 各タブに、そのタブの人数を表示する", async ({ page }) => {
    await page.goto("/accounts");

    await expect(
      page.getByRole("tab", { name: /^登録アカウント \d+/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^追跡アカウント \d+/ }),
    ).toBeVisible();
  });

  test("accounts-5: 管理者の登録アカウントには「管理者」ラベルを表示する", async ({
    page,
  }) => {
    await page.goto("/accounts");

    await expect(
      items(page).filter({ hasText: "Alice" }).getByText("管理者"),
    ).toBeVisible();
  });

  test("accounts-6: 一覧のアカウントには、名前の下の行に過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    await page.goto("/accounts");

    const item = items(page).filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(item.getByText("同期済み", { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("accounts-7: 追跡アカウントのタブには、フォローしている登録アカウントの数を「n人からフォロー」と表示する", async ({
    page,
  }) => {
    await page.goto("/accounts?tab=tracked");

    await expect(
      items(page)
        .filter({ hasText: "Bob" })
        .getByText(/^[1-9]\d*人からフォロー$/),
    ).toBeVisible();
  });

  test("accounts-8: 追跡アカウントのタブの「追跡アカウントとは？」を押すと、追跡アカウントの説明をモーダルで表示する", async ({
    page,
  }) => {
    await page.goto("/accounts?tab=tracked");

    await page.getByRole("button", { name: "追跡アカウントとは？" }).click();

    await expect(
      page
        .getByRole("dialog")
        .getByText(
          "登録アカウントと、登録アカウント1人以上からフォローされているアカウントです。これらのアカウントの投稿がサーバーに保存されます。",
        ),
    ).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("accounts-9: 登録アカウントのタブには「追跡アカウントとは？」を表示しない", async ({
    page,
  }) => {
    await page.goto("/accounts");

    await expect(
      page.getByRole("button", { name: "追跡アカウントとは？" }),
    ).toBeHidden();
  });

  test("accounts-10: 旧URLの /registered-accounts と /tracked-accounts は、/accounts の該当タブへ移動する", async ({
    page,
  }) => {
    await page.goto("/registered-accounts");
    await expect(page).toHaveURL("/accounts");

    await page.goto("/tracked-accounts");
    await expect(page).toHaveURL("/accounts?tab=tracked");
  });

  test("accounts-11: アカウントの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスピナーを表示する", async ({
    page,
  }) => {
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(/\/api\/registered-accounts/, async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "アカウント", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "アカウント" }),
    ).toBeVisible();
    const spinner = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(spinner).toBeVisible();
    release(undefined);
    await expect(spinner).toBeHidden();
  });

  test("accounts-12: タブの下の検索欄に入力すると、選んでいるタブの全件から表示名・ハンドルの部分一致で絞り込み、検索語を `?q=` に入れる", async ({
    page,
  }) => {
    await page.goto("/accounts?tab=tracked");
    await expect(items(page).filter({ hasText: "Alice" })).toBeVisible();

    await page.getByPlaceholder("名前・ハンドルで検索").fill("bob");

    await expect(page).toHaveURL("/accounts?tab=tracked&q=bob");
    await expect(items(page).filter({ hasText: "Bob" })).toBeVisible();
    await expect(items(page).filter({ hasText: "Alice" })).toBeHidden();
  });

  test("accounts-13: 検索に一致するアカウントがないときは「アカウントが見つかりません」を表示する", async ({
    page,
  }) => {
    await page.goto("/accounts");

    await page.getByPlaceholder("名前・ハンドルで検索").fill("zzzzzz");

    await expect(page.getByText("アカウントが見つかりません")).toBeVisible();
  });
});
