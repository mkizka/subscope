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

    await nav.getByRole("link", { name: "通知", exact: true }).click();

    await expect(
      nav.getByRole("link", { name: "通知", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "ホーム" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("layout-2: 左カラムのアカウント欄の⋯から「ログアウト」すると、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(() => "__TANSTACK_QUERY_CLIENT__" in window);

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

  test("layout-5: 右カラムに、見出し「サーバーについて」と「Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです」を出したカードを表示し、カード全体を `/server` へのリンクにする", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const card = page
      .getByRole("complementary")
      .getByRole("link", { name: /サーバーについて/ });
    await expect(card).toContainText(
      "Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです",
    );
    await card.click();

    await expect(page).toHaveURL("/server");
  });

  test("layout-9: `/server` では、同じ内容の重複を避けるため右カラムのカードを表示せず、中央カラムの位置は他のページと変えない", async ({
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
      page.getByRole("link", { name: /サーバーについて/ }),
    ).toHaveCount(0);
    expect((await page.getByRole("main").boundingBox())?.x).toBe(home?.x);
  });

  test("layout-11: 右カラムの検索ボックスで検索語を入力してEnterを押すと、`/search?q=検索語` に移動する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    await page
      .getByRole("complementary")
      .getByRole("searchbox", { name: "検索語" })
      .fill("alice");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/search?q=alice");
  });

  test("layout-12: `/search` では、中央に検索欄があるため右カラムの検索ボックスを表示しない", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/search");

    await expect(page.getByRole("searchbox", { name: "検索語" })).toHaveCount(
      1,
    );
    await expect(
      page.getByRole("complementary").getByRole("searchbox"),
    ).toHaveCount(0);
  });

  test("layout-4: ページの読み込み中は、画面上部に読み込み中のプログレスバーを表示する", async ({
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
    await page.waitForFunction(() => "__TANSTACK_QUERY_CLIENT__" in window);

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page
      .getByRole("dialog", { name: "メニュー" })
      .getByRole("button", { name: "ログアウト" })
      .click();

    await expect(page).toHaveURL("/login");
  });

  test("layout-13: モバイルでは、下にスクロールするとヘッダーを隠し、上にスクロールすると自分のアイコンを含むヘッダーを再び表示する", async ({
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

  test("layout-8: モバイルのドロワーには、PCの左カラムと同じメニュー項目に加えて「サーバー」を並べる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const sideNav = page.getByRole("navigation").getByRole("link");
    await expect(sideNav.filter({ hasText: "プロフィール" })).toBeVisible();
    const pcItems = await sideNav.allTextContents();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "メニューを開く" }).click();
    const drawerItems = await page
      .getByRole("dialog", { name: "メニュー" })
      .getByRole("link")
      .allTextContents();

    expect(drawerItems).toContain("サーバー");
    expect(drawerItems.filter((item) => item !== "サーバー")).toEqual(pcItems);
  });

  test("layout-10: モバイルのドロワーの「サーバー」から `/server` に移動できる", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page
      .getByRole("dialog", { name: "メニュー" })
      .getByRole("link", { name: "サーバー" })
      .click();

    await expect(page).toHaveURL("/server");
  });
});
