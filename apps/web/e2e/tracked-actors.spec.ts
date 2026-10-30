import { expect, test } from "@playwright/test";

import { login } from "./login";
import { follow, putRecord } from "./pds";

test.describe("追跡中のユーザー", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await login(page);
  });

  test("tracked-actors-1: 左カラムの「追跡中のユーザー」から、中央カラムに追跡アクター（名前、ハンドル、フォローしているメンバー数）を、フォローしているメンバーが多い順に一覧表示する", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "追跡中のユーザー" }).click();

    await expect(page).toHaveURL("/tracked-actors");
    const items = page.getByRole("main").getByRole("listitem");
    const bob = items.filter({ hasText: "Bob" });
    await expect(async () => {
      await page.reload();
      await expect(items.filter({ hasText: "Alice" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(bob.getByText(/^@/)).toBeVisible();
    await expect(bob.getByText(/^[1-9]\d* メンバーがフォロー$/)).toBeVisible();
    const counts = (
      await items.getByText(/メンバーがフォロー$/).allTextContents()
    ).map((text) => parseInt(text, 10));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  test("tracked-actors-2: 一覧のユーザーを選ぶと、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    await page.goto("/tracked-actors");

    await page.getByRole("main").getByRole("link", { name: /^Bob/ }).click();

    await expect(page).toHaveURL(/\/tracked-actors\?profile=/);
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(panel.getByText("Bob")).toBeVisible();
  });

  test("tracked-actors-4: 見出しの横に追跡アクターの人数を出す", async ({
    page,
  }) => {
    await page.goto("/tracked-actors");

    await expect(page.getByRole("main").getByText(/^\d+人$/)).toBeVisible();
  });
});
