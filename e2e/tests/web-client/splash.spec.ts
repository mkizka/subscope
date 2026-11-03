import { expect, test } from "@playwright/test";

test.describe("起動時のスプラッシュ", () => {
  test("splash-1: 自分の情報の取得が終わるまで、ロゴと「読み込み中」と読み込み中のプログレスバーを全画面で表示する", async ({
    page,
  }) => {
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });

    await page.goto("/");

    const splash = page.getByRole("status");
    await expect(splash).toHaveText("読み込み中");
    await expect(page.getByText("Subscope", { exact: true })).toBeVisible();
    const box = await splash.locator("..").boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width).toBe(viewport?.width);
    expect(box?.height).toBe(viewport?.height);
    release();
  });

  test("splash-2: 自分の情報の取得が終わると、スプラッシュを消してメニューとアバターが揃った画面を表示する", async ({
    page,
  }) => {
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.getByRole("status")).toBeVisible();

    release();

    await expect(page.getByRole("status")).toBeHidden();
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "リスト" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "プロフィール" })).toBeVisible();
    await expect(nav.getByText("@alice.test")).toBeVisible();
  });

  test("splash-3: アプリ内でページを移動したときは、スプラッシュを表示しない", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toBeHidden();

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "アカウント", exact: true })
      .click();

    await expect(page).toHaveURL("/accounts");
    await expect(page.getByRole("status")).toBeHidden();
  });
});
