import { expect, test } from "@playwright/test";

test.describe("レイアウト", () => {
  test("layout-1: 左カラムのメニューで、今いるページの項目を強調する", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nav.getByRole("link", { name: "メンバー" }).click();

    await expect(nav.getByRole("link", { name: "メンバー" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "ホーム" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("layout-2: 左カラムのアカウント欄の⋯から「ログアウト」すると、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await nav.getByRole("button", { name: "アカウントメニュー" }).click();
    await nav.getByRole("button", { name: "ログアウト" }).click();

    await expect(page).toHaveURL("/login");
  });

  test("layout-3: 左カラムのアカウント欄に、自分のハンドルを表示する", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(
        page.getByRole("navigation").getByText("@alice.test"),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("layout-5: 右カラムに、このサーバーがメンバーとそのフォロー先の投稿だけを保存することを表示する", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("complementary", { name: "このサーバーについて" }),
    ).toContainText("メンバーとそのフォロー先の投稿だけを保存します");
  });

  test("layout-4: ページの読み込み中は、画面上部に読み込み中のプログレスバーを表示する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(() => "__TANSTACK_QUERY_CLIENT__" in window);
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/members.data*", async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "メンバー" })
      .click();

    const progress = page.getByRole("progressbar", { name: "読み込み中" });
    await expect(progress).toBeVisible();
    release();
    await expect(progress).toBeHidden();
  });
});

test.describe("レイアウト（モバイル）", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("layout-6: モバイルでは、下のタブで今いるページの項目を強調する", async ({
    page,
  }) => {
    await page.goto("/");

    const tabs = page.getByRole("navigation", { name: "タブバー" });
    await expect(tabs.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await tabs.getByRole("link", { name: "検索" }).click();

    await expect(tabs.getByRole("link", { name: "検索" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      tabs.getByRole("link", { name: "ホーム" }),
    ).not.toHaveAttribute("aria-current");
  });

  test("layout-7: モバイルでは、ヘッダーの自分のアイコンから開くドロワーの「ログアウト」で、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page
      .getByRole("dialog", { name: "メニュー" })
      .getByRole("button", { name: "ログアウト" })
      .click();

    await expect(page).toHaveURL("/login");
  });
});
