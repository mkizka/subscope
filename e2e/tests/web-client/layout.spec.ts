import { expect, type Page, test } from "@playwright/test";

const rightColumn = (page: Page) =>
  page.getByRole("complementary").filter({
    hasNot: page.getByRole("navigation"),
  });

test.describe("レイアウト", () => {
  test("layout-e4: `/server` では、同じ内容の重複を避けるため右カラムのカードを表示せず、中央カラムの位置は他のページと変えない", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const home = await page.getByRole("main").boundingBox();
    await page.goto("/server");

    await expect(
      page.getByRole("main").getByRole("heading", { name: "サーバーについて" }),
    ).toBeVisible();
    await expect(
      rightColumn(page).getByRole("link", { name: /サーバーについて/ }),
    ).toHaveCount(0);
    expect((await page.getByRole("main").boundingBox())?.x).toBe(home?.x);
  });

  test("layout-e5: 右カラムの検索ボックスで検索語を入力してEnterを押すと、`/search?q=検索語` に移動する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const searchbox = page
      .getByRole("complementary")
      .getByRole("searchbox", { name: "検索語" });
    await searchbox.fill("alice");
    await searchbox.press("Enter");

    await expect(page).toHaveURL("/search?q=alice");
  });

  test("layout-e7: 右カラムの検索ボックスに入力すると、入力に合うアカウントの候補（アイコン、表示名、ハンドル）を下に表示し、候補を選ぶとそのアカウントのプロフィールに移動する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const sidebar = page.getByRole("complementary");
    const link = sidebar.getByRole("link", { name: /alice\.test/ });
    await expect(async () => {
      await page.reload();
      await sidebar.getByRole("searchbox", { name: "検索語" }).fill("alice");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();

    await expect(page).toHaveURL("/alice.test");
  });

  test("layout-e2: ページの読み込み中は、画面上部に読み込み中のプログレスバーを表示する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(() => "__TANSTACK_QUERY_CLIENT__" in window);
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/alice.test.data*", async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "プロフィール" })
      .click();

    const progress = page.getByRole("progressbar", { name: "読み込み中" });
    await expect(progress).toBeVisible();
    release();
    await expect(progress).toBeHidden();
  });
});

test.describe("レイアウト（モバイル）", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("layout-e6: モバイルでは、下にスクロールするとヘッダーを隠し、上にスクロールすると自分のアイコンを含むヘッダーを再び表示する", async ({
    page,
  }) => {
    await page.goto("/server");
    await page.waitForFunction(() => "__TANSTACK_QUERY_CLIENT__" in window);
    await page.evaluate(() => {
      document.body
        .querySelector("main")
        ?.style.setProperty("min-height", "3000px");
    });
    const menuButton = page.getByRole("button", { name: "メニューを開く" });

    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(menuButton).not.toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(menuButton).toBeInViewport();
  });
});
