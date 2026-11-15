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

  test("followList-e1: プロフィールのフォロー数から、フォローの一覧（名前、ハンドル、自己紹介）を開く", async ({
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

  test("followList-e2: プロフィールのフォロワー数から、フォロワーの一覧（名前、ハンドル、自己紹介）を開く", async ({
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

  test("followList-e3: 一覧のアカウントを選ぶと、そのプロフィールに移動する", async ({
    page,
  }) => {
    await page.goto("/alice.test/follows");

    await page.getByRole("main").getByRole("link", { name: /^Bob/ }).click();

    await expect(page).toHaveURL(/\/(?!alice\.)[^/]+\.test$/);
    await expect(
      page.getByRole("main").getByRole("heading", { name: "Bob", exact: true }),
    ).toBeVisible();
  });

  test("followList-e5: 「メンバー」タブ（`?filter=registered`）は、フォロワーのうちメンバーだけを表示する", async ({
    page,
  }) => {
    await page.goto("/bob.test/followers");

    await page.getByRole("tab", { name: /^メンバー/ }).click();

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

  test("followList-e6: サーバーページの「誰かがフォロー」タブで「n人からフォロー」を押すと、フォロワー一覧の「メンバー」タブに移動する", async ({
    page,
  }) => {
    const link = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Bob" })
      .getByRole("link", { name: /^[1-9]\d*人からフォロー$/ });
    await expect(async () => {
      await page.goto("/server?tab=tracked");
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();

    await link.click();

    await expect(page).toHaveURL(/\/followers\?filter=registered$/);
  });

  test("followList-e7: 見出しは「{名前}のフォロー」「{名前}のフォロワー」とし、戻るボタンでプロフィールに移動する", async ({
    page,
  }) => {
    await page.goto("/alice.test/follows");

    await expect(
      page.getByRole("heading", { name: "Aliceのフォロー" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "戻る" }).click();

    await expect(page).toHaveURL("/alice.test");
  });

  test("followList-e8: 「知り合い」タブ（`?filter=known`）は、フォロワーのうち自分がフォローしている人だけを、自分がフォローした新しい順に表示する", async ({
    page,
  }) => {
    await follow("bob.test", "carol.test");
    await page.goto("/carol.test/followers");

    await page.getByRole("tab", { name: "知り合い" }).click();

    await expect(page).toHaveURL("/carol.test/followers?filter=known");
    const accounts = page.getByRole("main").getByRole("listitem");
    await expect(async () => {
      await page.reload();
      await expect(accounts).toHaveText([/Bob/], { timeout: 1000 });
    }).toPass();
  });
});
