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
    await page.goto(`/search?${new URLSearchParams({ q })}`);
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

  test("search-e1: 左カラムの「検索」から開いた検索欄でユーザータブに切り替えて検索すると、表示名またはハンドルが検索語に部分一致するアカウント（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "検索", exact: true }).click();
    await expect(page).toHaveURL("/search");

    const main = page.getByRole("main");
    await main.getByRole("tab", { name: "ユーザー" }).click();
    await main.getByRole("searchbox", { name: "検索語" }).fill("lic");
    await main.getByRole("button", { name: "検索" }).click();

    await expect(page).toHaveURL("/search?q=lic&tab=accounts");
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

  test("search-e2: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    const link = page.getByRole("main").getByRole("link", { name: /^Alice/ });
    await expect(async () => {
      await page.goto("/search?q=alice&tab=accounts");
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

  test("search-e3: 投稿タブ（最初に表示されるタブ）で検索すると、本文が検索語に部分一致する投稿を、リプライを除いて新しい順に一覧表示する", async ({
    page,
  }) => {
    const q = `search3-${Date.now()}`;
    const older = await post(`古い ${q} 投稿`);
    await post(`新しい ${q} 投稿`);
    await post(`返信 ${q}`, older);
    await searchPosts(page, q, `新しい ${q} 投稿`);
    await page.goto("/search");

    await page.getByRole("searchbox", { name: "検索語" }).fill(q);
    await page.getByRole("button", { name: "検索" }).click();

    await expect(page).toHaveURL(`/search?q=${q}`);
    await expect(page.getByRole("main").getByRole("article")).toHaveText([
      new RegExp(`新しい ${q} 投稿`),
      new RegExp(`古い ${q} 投稿`),
    ]);
  });
});
