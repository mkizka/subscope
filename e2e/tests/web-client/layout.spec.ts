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

    await expect(page.getByRole("complementary")).toContainText(
      "メンバーとそのフォロー先の投稿だけを保存します",
    );
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
