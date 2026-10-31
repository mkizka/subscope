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

  test("follow-list-1: プロフィール全体ページのフォロー数から、中央カラムにそのユーザーのフォロー（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/profile/alice.test");

    await page.getByRole("link", { name: /^\d+ フォロー$/ }).click();

    await expect(page).toHaveURL("/profile/alice.test/follows");
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

  test("follow-list-2: プロフィール全体ページのフォロワー数から、中央カラムにそのユーザーのフォロワー（名前、ハンドル、自己紹介）を一覧表示する", async ({
    page,
  }) => {
    await page.goto("/profile/bob.test");

    await page.getByRole("link", { name: /^\d+ フォロワー$/ }).click();

    await expect(page).toHaveURL("/profile/bob.test/followers");
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

  test("follow-list-3: 一覧のユーザーを選ぶと、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    await page.goto("/profile/alice.test/follows");

    await page.getByRole("main").getByRole("link", { name: /^Bob/ }).click();

    await expect(page).toHaveURL(/\/profile\/alice\.test\/follows\?profile=/);
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(
      panel.getByRole("heading", { name: "Bob", exact: true }),
    ).toBeVisible();
  });
});
