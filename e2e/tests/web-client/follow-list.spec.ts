import { expect, test } from "@playwright/test";

import { follow, putRecord } from "../../helpers/pds";

test.describe("フォロー・フォロワー", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "follow-listの自己紹介",
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await page.goto("/");
  });

  test("follow-list-1: プロフィール全体ページのフォロー数から、中央カラムにそのアカウントのフォロー（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");

    await page.getByRole("link", { name: /^\d+ フォロー$/ }).click();

    await expect(page).toHaveURL("/alice.test/follows");
    const bob = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(bob).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(bob.getByText("@bob.test")).toBeVisible();
  });

  test("follow-list-2: プロフィール全体ページのフォロワー数から、中央カラムにそのアカウントのフォロワー（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/bob.test");

    await page.getByRole("link", { name: /^\d+ フォロワー$/ }).click();

    await expect(page).toHaveURL("/bob.test/followers");
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice.getByText("follow-listの自己紹介")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(alice.getByText("@alice.test")).toBeVisible();
  });

  test("follow-list-3: 一覧のアカウントを選ぶと、そのアカウントのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    await page.goto("/alice.test/follows");

    await page.getByRole("main").getByRole("link", { name: /^Bob/ }).click();

    await expect(page).toHaveURL(/\/(?!alice\.)[^/]+\.test$/);
    await expect(
      page.getByRole("main").getByRole("heading", { name: "Bob", exact: true }),
    ).toBeVisible();
  });

  test("follow-list-4: 一覧の追跡アカウントには、過去の投稿の同期状態を表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test/follows");

    const item = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(item.getByText("同期済み", { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("follow-list-5: 一覧を開くと、読み込みを待たずに見出しを表示し、読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/api/profile/*/follows", async (route) => {
      await released;
      await route.continue();
    });

    await page.getByRole("link", { name: /^\d+ フォロー$/ }).click();

    await expect(page.getByRole("heading", { name: "フォロー" })).toBeVisible();
    const skeleton = page.getByRole("status", { name: "読み込み中" });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("follow-list-6: 一度表示した一覧に戻ると、読み込み直しを待たずに前回の一覧を表示する", async ({
    page,
  }) => {
    const bob = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Bob" });
    await expect(async () => {
      await page.goto("/alice.test/follows");
      await expect(bob).toBeVisible({ timeout: 1000 });
    }).toPass();
    await bob.getByRole("link").click();
    await expect(page).toHaveURL(/\/(?!alice\.)[^/]+\.test$/);
    await page.route("**/api/profile/*/follows", () => {});

    await page.goBack();

    await expect(bob).toBeVisible();
  });

  test("follow-list-7: フォロワー一覧に「すべて」と「登録アカウント」のタブを表示し、「登録アカウント」には人数を添える", async ({
    page,
  }) => {
    await page.goto("/bob.test/followers");

    await expect(page.getByRole("tab", { name: "すべて" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^登録アカウント \d+$/ }),
    ).toBeVisible();
  });

  test("follow-list-8: 「登録アカウント」タブ（`?filter=registered`）には、そのアカウントをフォローしている登録アカウントだけを一覧表示する", async ({
    page,
  }) => {
    await page.goto("/bob.test/followers");

    await page.getByRole("tab", { name: /^登録アカウント/ }).click();

    await expect(page).toHaveURL("/bob.test/followers?filter=registered");
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("follow-list-9: アカウント一覧の追跡アカウントの「n人からフォロー」を押すと、そのアカウントのフォロワー一覧の「登録アカウント」タブに移動する", async ({
    page,
  }) => {
    const link = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Bob" })
      .getByRole("link", { name: /^[1-9]\d*人からフォロー$/ });
    await expect(async () => {
      await page.goto("/accounts?tab=tracked");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();

    await link.click();

    await expect(page).toHaveURL(/\/followers\?filter=registered$/);
  });
});
