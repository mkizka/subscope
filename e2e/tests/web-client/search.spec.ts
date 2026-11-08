import { expect, type Page, test } from "@playwright/test";

import { createRecord, putRecord } from "../../helpers/pds";

const post = (text: string, parent?: { uri: string; cid: string }) =>
  createRecord("alice.test", "app.bsky.feed.post", {
    text,
    reply: parent && { root: parent, parent },
    createdAt: new Date().toISOString(),
  });

const searchPosts = async (page: Page, q: string, text: string) => {
  const article = page.getByRole("article").filter({ hasText: text });
  await expect(async () => {
    await page.goto(`/search?${new URLSearchParams({ q, tab: "posts" })}`);
    await expect(article).toBeVisible({ timeout: 1000 });
  }).toPass();
  return article;
};

test.describe("検索", () => {
  test.beforeEach(async () => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "Blueskyを使っています",
    });
  });

  test("search-11: 検索語がないときは、検索欄の下に探せる対象（追跡アカウントと投稿）の説明を出す", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(
      page.getByText(
        "このサーバーに保存されているアカウントと投稿を検索できます",
      ),
    ).toBeVisible();
  });

  test("search-1: 左カラムの「検索」から開いた検索欄で検索すると、表示名またはハンドルが検索語に部分一致するアカウント（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "検索", exact: true }).click();
    await expect(page).toHaveURL("/search");

    const main = page.getByRole("main");
    await main.getByRole("searchbox", { name: "検索語" }).fill("lic");
    await main.getByRole("button", { name: "検索" }).click();

    await expect(page).toHaveURL("/search?q=lic");
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(alice.getByText("@alice.test")).toBeVisible();
    await expect(alice.getByText("Blueskyを使っています")).toBeVisible();
  });

  test("search-2: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    const link = page.getByRole("main").getByRole("link", { name: /^Alice/ });
    await expect(async () => {
      await page.goto("/search?q=alice");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();

    await link.click();

    await expect(page).toHaveURL("/alice.test");
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("search-3: 一致するアカウントがないときは「ユーザーが見つかりません」と表示する", async ({
    page,
  }) => {
    await page.goto("/search?q=nobody-matches-this");

    await expect(page.getByText("ユーザーが見つかりません")).toBeVisible();
  });

  test("search-4: URLに `?q=検索語` があると、検索欄にその語を入れて検索結果を表示する", async ({
    page,
  }) => {
    await page.goto("/search?q=alice");

    await expect(page.getByRole("searchbox", { name: "検索語" })).toHaveValue(
      "alice",
    );
    await expect(
      page.getByRole("main").getByRole("listitem").filter({ hasText: "Alice" }),
    ).toBeVisible();
  });

  test("search-5: 「投稿」タブで検索すると、本文が検索語に部分一致する投稿を、リプライを除いて新しい順に一覧表示する", async ({
    page,
  }) => {
    const q = `search5-${Date.now()}`;
    const older = await post(`古い ${q} 投稿`);
    await post(`新しい ${q} 投稿`);
    await post(`返信 ${q}`, older);
    await searchPosts(page, q, `新しい ${q} 投稿`);
    await page.goto("/search?q=x");

    await page.getByRole("tab", { name: "投稿" }).click();
    await page.getByRole("searchbox", { name: "検索語" }).fill(q);
    await page.getByRole("button", { name: "検索" }).click();

    await expect(page).toHaveURL(`/search?q=${q}&tab=posts`);
    await expect(page.getByRole("main").getByRole("article")).toHaveText([
      new RegExp(`新しい ${q} 投稿`),
      new RegExp(`古い ${q} 投稿`),
    ]);
  });

  test("search-6: 一致する投稿がないときは「投稿が見つかりません」と表示する", async ({
    page,
  }) => {
    await page.goto("/search?q=nobody-matches-this&tab=posts");

    await expect(page.getByText("投稿が見つかりません")).toBeVisible();
  });

  test("search-7: 検索ボタンは、検索結果のページに移るまでスピナーを出して押せなくする", async ({
    page,
  }) => {
    await page.goto("/search");
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/search*", async (route) => {
      await held;
      await route.continue();
    });
    const button = page.getByRole("button", { name: "検索" });

    await page.getByRole("searchbox", { name: "検索語" }).fill("alice");
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button.locator(".animate-spin")).toBeVisible();
    release();
    await expect(button).toBeEnabled();
  });

  test("search-8: アカウントの検索結果には、過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "@alice.test" });
    await expect(async () => {
      await page.goto("/search?q=alice");
      await expect(alice.getByText("同期済み", { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("search-9: 検索結果のページを開くと、結果の読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/search");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/api/search*", async (route) => {
      await released;
      await route.continue();
    });

    await page.getByRole("searchbox", { name: "検索語" }).fill("alice");
    await page.getByRole("button", { name: "検索" }).click();

    await expect(page).toHaveURL("/search?q=alice");
    const skeleton = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("search-10: 一度表示した検索結果に戻ると、読み込み直しを待たずに前回の結果を表示する", async ({
    page,
  }) => {
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "@alice.test" });
    await expect(async () => {
      await page.goto("/search?q=alice");
      await expect(alice).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "通知", exact: true })
      .click();
    await expect(page).toHaveURL("/notifications");
    await page.route("**/api/search*", () => {});

    await page.goBack();

    await expect(alice).toBeVisible();
  });
});

test.describe("検索履歴", () => {
  const searchbox = (page: Page) =>
    page.getByRole("main").getByRole("searchbox", { name: "検索語" });
  const history = (page: Page) =>
    page.getByRole("main").getByRole("list", { name: "検索履歴" });

  const openHistory = (page: Page) =>
    expect(async () => {
      await searchbox(page).blur();
      await searchbox(page).focus();
      await expect(history(page)).toBeVisible({ timeout: 500 });
    }).toPass();

  const seedHistory = (page: Page, words: string[]) =>
    page.addInitScript(
      (value) => localStorage.setItem("search-history", value),
      JSON.stringify(words),
    );

  test("search-12: 検索欄にフォーカスすると、過去に検索した語を新しい順に最大10件、検索欄の下に表示する", async ({
    page,
  }) => {
    await seedHistory(
      page,
      Array.from({ length: 11 }, (_, i) => `word${11 - i}`),
    );
    await page.goto("/search?q=word5");

    await openHistory(page);

    const items = history(page).getByRole("listitem");
    await expect(items).toHaveCount(10);
    await expect(items.first()).toContainText("word5");
    await expect(items.nth(1)).toContainText("word11");
    await expect(
      history(page).getByRole("link", { name: "word1", exact: true }),
    ).toHaveCount(0);
  });

  test("search-13: 履歴の語を選ぶと、その語で検索する", async ({ page }) => {
    await seedHistory(page, ["bar", "foo"]);
    await page.goto("/search");

    await openHistory(page);
    await history(page).getByRole("link", { name: "foo" }).click();

    await expect(page).toHaveURL("/search?q=foo");
  });

  test("search-14: 履歴の語は個別に、または「履歴を全て削除」で全て削除できる", async ({
    page,
  }) => {
    await seedHistory(page, ["bar", "foo"]);
    await page.goto("/search");

    await openHistory(page);
    await history(page).getByRole("button", { name: "fooを削除" }).click();
    await expect(history(page)).not.toContainText("foo");
    await expect(history(page)).toContainText("bar");

    await page.getByRole("button", { name: "履歴を全て削除" }).click();
    await expect(history(page)).toBeHidden();
  });
});
