import { expect, test } from "@playwright/test";

import { putRecord } from "./pds";

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

  test("search-2: 一覧のユーザーを選ぶと、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    const link = page.getByRole("main").getByRole("link", { name: /^Alice/ });
    await expect(async () => {
      await page.goto("/search?q=alice");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();

    await link.click();

    await expect(page).toHaveURL(/\/search\?q=alice&profile=/);
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(
      panel.getByRole("heading", { name: "Alice", exact: true }),
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
});
