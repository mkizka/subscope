import { expect, test } from "@playwright/test";

import { login } from "./login";
import { follow, putRecord } from "./pds";

test.describe("追跡中のユーザー", () => {
  test.beforeEach(async ({ page }) => {
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
    const bob = items.filter({ hasText: "@bob.test" });
    const alice = items.filter({ hasText: "@alice.test" });
    await expect(async () => {
      await page.reload();
      await expect(bob.getByText("Bob")).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(bob.getByText(/^[1-9]\d* メンバーがフォロー$/)).toBeVisible();
    await expect(alice).toBeVisible();
    const handles = await items.getByText(/^@/).allTextContents();
    expect(handles.indexOf("@bob.test")).toBeLessThan(
      handles.indexOf("@alice.test"),
    );
  });

  test("tracked-actors-2: 一覧のユーザーを選ぶと、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    await page.goto("/tracked-actors");

    await page.getByRole("link", { name: /@alice\.test/ }).click();

    await expect(page).toHaveURL("/tracked-actors?profile=alice.test");
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(panel.getByText("@alice.test")).toBeVisible();
  });
});
