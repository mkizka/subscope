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

  test("search-1: 左カラムの「検索」から開いた検索欄で検索すると、表示名またはハンドルが検索語に部分一致するユーザー（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "検索", exact: true }).click();
    await expect(page).toHaveURL("/search");

    await page.getByRole("searchbox", { name: "検索語" }).fill("lic");
    await page.getByRole("button", { name: "検索" }).click();

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

  test("search-2: 一覧のユーザーを選ぶと、そのユーザーのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    const link = page.getByRole("main").getByRole("link", { name: /^Alice/ });
    await expect(async () => {
      await page.goto("/search?q=alice");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();

    await link.click();

    await expect(page).toHaveURL("/profile/alice.test");
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("search-3: 一致するユーザーがいないときは「ユーザーが見つかりません」と表示する", async ({
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

  test("search-7: 一覧の投稿を選ぶと、検索結果を表示したまま右カラムにその投稿のスレッドを開く", async ({
    page,
  }) => {
    const text = `search7-${Date.now()}`;
    await post(text);
    const article = await searchPosts(page, text, text);

    await article.getByRole("link", { name: "スレッドを開く" }).click();

    await expect(page).toHaveURL(/\/search\?q=search7-\d+&tab=posts&thread=/);
    await expect(article).toBeVisible();
    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(text),
    ).toBeVisible();
  });
});
