import { expect, type Page, test } from "@playwright/test";

const rightColumn = (page: Page) =>
  page.getByRole("complementary").filter({
    hasNot: page.getByRole("navigation"),
  });

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

    const card = rightColumn(page).getByRole("link", {
      name: /サーバーについて/,
    });
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
      rightColumn(page).getByRole("link", { name: /サーバーについて/ }),
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

  test("layout-16: 右カラムの検索ボックスに入力すると、入力に合うアカウントの候補（アイコン、表示名、ハンドル）を下に表示し、候補を選ぶとそのアカウントのプロフィールに移動する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const sidebar = page.getByRole("complementary");
    const link = sidebar.getByRole("link", { name: /alice\.test/ });
    await expect(async () => {
      await sidebar.getByRole("searchbox", { name: "検索語" }).fill("alice");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();

    await expect(page).toHaveURL("/alice.test");
  });

  const seedHistory = (page: Page, words: string[]) =>
    page.addInitScript(
      (value) => localStorage.setItem("search-history", value),
      JSON.stringify(words),
    );

  const sidebarHistory = (page: Page) =>
    page.getByRole("complementary").getByRole("list", { name: "検索履歴" });

  const openSidebarHistory = (page: Page) =>
    expect(async () => {
      const searchbox = page
        .getByRole("complementary")
        .getByRole("searchbox", { name: "検索語" });
      await searchbox.blur();
      await searchbox.focus();
      await expect(sidebarHistory(page)).toBeVisible({ timeout: 500 });
    }).toPass();

  test("layout-17: 右カラムの検索ボックスにフォーカスして何も入力していないとき、過去に検索した語を新しい順に最大10件、検索ボックスの下に表示する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedHistory(
      page,
      Array.from({ length: 11 }, (_, i) => `word${11 - i}`),
    );
    await page.goto("/");

    await openSidebarHistory(page);

    const items = sidebarHistory(page).getByRole("listitem");
    await expect(items).toHaveCount(10);
    await expect(items.first()).toContainText("word11");
  });

  test("layout-18: 右カラムの履歴の語を選ぶと、その語で検索する", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedHistory(page, ["bar", "foo"]);
    await page.goto("/");

    await openSidebarHistory(page);
    await sidebarHistory(page).getByRole("link", { name: "foo" }).click();

    await expect(page).toHaveURL("/search?q=foo");
  });

  test("layout-19: 右カラムの履歴の語は個別に、または「履歴を全て削除」で全て削除できる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedHistory(page, ["bar", "foo"]);
    await page.goto("/");

    await openSidebarHistory(page);
    await sidebarHistory(page)
      .getByRole("button", { name: "fooを削除" })
      .click();
    await expect(sidebarHistory(page)).not.toContainText("foo");
    await expect(sidebarHistory(page)).toContainText("bar");

    await page
      .getByRole("complementary")
      .getByRole("button", { name: "履歴を全て削除" })
      .click();
    await expect(sidebarHistory(page)).toBeHidden();
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

  test("layout-14: スケルトンは、左から右へ光が流れるアニメーションで読み込み中であることを示す", async ({
    page,
  }) => {
    await page.goto("/search");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/api/timeline*", async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "ホーム" })
      .click();

    const skeleton = page
      .getByRole("status", { name: "読み込み中", exact: true })
      .locator(".skeleton")
      .first();
    await expect(skeleton).toHaveCSS("animation-name", "skeleton-shimmer");
    release(undefined);
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

  test("layout-15: モバイルでは、下のタブにラベル文字を出さず、アイコンだけを表示する", async ({
    page,
  }) => {
    await page.goto("/");

    const tabs = page.getByRole("navigation", { name: "タブバー" });
    await expect(tabs.getByRole("link", { name: "ホーム" })).toBeVisible();
    await expect(tabs.getByText("ホーム")).toHaveCount(0);
    await expect(tabs.getByText("プロフィール")).toHaveCount(0);
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

  test("layout-8: モバイルのドロワーには、PCの左カラムと同じメニュー項目を並べる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const sideNav = page.getByRole("navigation").getByRole("link");
    await expect(sideNav.filter({ hasText: "プロフィール" })).toBeVisible();
    const pcItems = await sideNav.allTextContents();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "メニューを開く" }).click();
    const drawer = page.getByRole("dialog", { name: "メニュー" });
    const drawerItems = await drawer
      .getByRole("navigation")
      .getByRole("link")
      .allTextContents();

    expect(drawerItems).toEqual(pcItems);
  });

  test("layout-10: 左カラムとモバイルのドロワーのメニューの「サーバーについて」から `/server` に移動できる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "サーバーについて" })
      .click();
    await expect(page).toHaveURL("/server");

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page
      .getByRole("dialog", { name: "メニュー" })
      .getByRole("link", { name: "サーバーについて" })
      .click();
    await expect(page).toHaveURL("/server");
  });
});
