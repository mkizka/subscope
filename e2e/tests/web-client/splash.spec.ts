import { expect, test } from "@playwright/test";

test.describe("起動時のスプラッシュ", () => {
  test("splash-e1: 自分の情報の取得が終わるまで、ロゴと読み込み中のプログレスバーを全画面で表示する", async ({
    page,
  }) => {
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });

    await page.goto("/");

    const splash = page.getByTestId("splash");
    await expect(
      page.getByText("Subscope", { exact: true }).first(),
    ).toBeVisible();
    const box = await splash.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.x).toBe(0);
    expect(box?.width).toBeGreaterThan((viewport?.width ?? 0) - 20);
    expect(box?.height).toBe(viewport?.height);
    release();
  });

  test("splash-e2: 自分の情報の取得が終わると、スプラッシュを消してメニューとアバターが揃った画面を表示する", async ({
    page,
  }) => {
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.getByTestId("splash")).toBeVisible();

    release();

    await expect(page.getByTestId("splash")).toBeHidden();
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "リスト" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "プロフィール" })).toBeVisible();
    await expect(nav.getByText("@alice.test")).toBeVisible();
  });

  test("splash-e3: アプリ内でページを移動したときは、スプラッシュを表示しない", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("splash")).toBeHidden();

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "通知", exact: true })
      .click();

    await expect(page).toHaveURL("/notifications");
    await expect(page.getByTestId("splash")).toBeHidden();
  });

  test("splash-e5: 自分の情報の取得が終わると、スプラッシュを約300msかけてフェードして消す", async ({
    page,
  }) => {
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });
    await page.goto("/");
    const splash = page.getByTestId("splash");
    await expect(splash).toHaveCSS("opacity", "1");
    await page.evaluate(() => {
      Object.assign(window, { faded: false });
      new MutationObserver(() => {
        if (document.querySelector(".opacity-0")) {
          Object.assign(window, { faded: true });
        }
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    });

    release();

    await expect(splash).toBeHidden();
    expect(
      await page.evaluate(() => Reflect.get(window, "faded") === true),
    ).toBe(true);
  });

  test("splash-e6: prefers-reduced-motionが有効なときは、フェードせずにスプラッシュを消す", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/me", async (route) => {
      await released;
      await route.continue();
    });
    await page.goto("/");
    const status = page.getByTestId("splash");
    await expect(status).toBeVisible();
    await page.evaluate(() => {
      Object.assign(window, { faded: false });
      new MutationObserver(() => {
        if (document.querySelector(".opacity-0")) {
          Object.assign(window, { faded: true });
        }
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    });

    release();

    await expect(status).toBeHidden();
    expect(
      await page.evaluate(() => Reflect.get(window, "faded") === true),
    ).toBe(false);
  });
});

test.describe("起動時のスプラッシュ（JS無効）", () => {
  test.use({ javaScriptEnabled: false });

  test("splash-e4: JSが読み込まれる前から、サーバーが返すHTMLにスプラッシュを含める", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("splash")).toBeVisible();
  });
});
