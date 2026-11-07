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

  test("server-1: 見出し「サーバーについて」の下に、「Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです」と説明する", async ({
    page,
  }) => {
    await page.goto("/server");

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "サーバーについて" }),
    ).toBeVisible();
    await expect(
      main.getByText(
        "Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです",
      ),
    ).toBeVisible();
  });

  test("server-2: 項目「運営者」に、最初に管理者になった1人のアイコンと名前を表示し、選ぶとそのアカウントのプロフィール全体ページに移動する", async ({
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

  test("server-3: 項目「サーバーDID」に、サーバーDID `did:web:{ホスト}#bsky_appview` を表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    await expect(page.getByText("サーバーDID", { exact: true })).toBeVisible();
    await expect(page.getByText(/^did:web:.+#bsky_appview$/)).toBeVisible();
  });

  test("server-4: サーバーDIDの文字列とコピーアイコンをひとつのボタンにし、押すとサーバーDIDをクリップボードにコピーできる", async ({
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

  test("server-6: 「メンバー」タブでは、メンバーの一覧（名前、ハンドル、自己紹介）を表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    const alice = items(page).filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice.getByText("Blueskyを使っています")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(alice.getByText(/^@/)).toBeVisible();
  });

  test("server-7: 「誰かがフォロー」タブでは、フォローされているアカウント（名前、ハンドル）を、フォローしているメンバーが多い順に一覧表示する", async ({
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

  test("server-8: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
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

  test("server-5: 「メンバー」「誰かがフォロー」のタブを表示し、タブ見出しに各タブの人数を出す", async ({
    page,
  }) => {
    await page.goto("/server");

    await expect(
      page.getByRole("tab", { name: /^メンバー \d+/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^誰かがフォロー \d+/ }),
    ).toBeVisible();
  });

  test("server-9: 管理者には「運営者」ラベルを表示する", async ({ page }) => {
    await page.goto("/server");

    await expect(
      items(page).filter({ hasText: "Alice" }).getByText("運営者"),
    ).toBeVisible();
  });

  test("server-10: 一覧のアカウントには、名前の下の行に過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    const item = items(page).filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(item.getByText("同期済み", { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("server-11: 「誰かがフォロー」タブには、フォローしているメンバーの数を「n人からフォロー」と表示する", async ({
    page,
  }) => {
    await page.goto("/server?tab=tracked");

    await expect(
      items(page)
        .filter({ hasText: "Bob" })
        .getByText(/^[1-9]\d*人からフォロー$/),
    ).toBeVisible();
  });

  test("server-12: 旧URLは、`/server` の該当タブへ移動する", async ({
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

  test("server-13: 一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(/\/api\/registered-accounts/, async (route) => {
      await released;
      await route.continue();
    });

    await page.goto("/server");

    await expect(
      page.getByRole("heading", { name: "サーバーについて" }),
    ).toBeVisible();
    const skeleton = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("server-16: 運営者とサーバーDIDは、読み込み終えるまで値の場所にスケルトンを表示する", async ({
    page,
  }) => {
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(/\/api\/server-info/, async (route) => {
      await released;
      await route.continue();
    });

    await page.goto("/server");

    const skeleton = page.getByRole("status", {
      name: "サーバーDIDを読み込み中",
    });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
    await expect(page.getByText(/^did:web:.+#bsky_appview$/)).toBeVisible();
  });

  test("server-14: タブの下の検索欄に入力すると、選んでいるタブの全件から表示名・ハンドルの部分一致で絞り込み、検索語を `?q=` に入れる", async ({
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

  test("server-15: 検索に一致するアカウントがないときは「アカウントが見つかりません」を表示する", async ({
    page,
  }) => {
    await page.goto("/server");

    await page.getByPlaceholder("名前・ハンドルで検索").fill("zzzzzz");

    await expect(page.getByText("アカウントが見つかりません")).toBeVisible();
  });
});
