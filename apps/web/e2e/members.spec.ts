import { expect, test } from "@playwright/test";

import { login } from "./login";
import { putRecord } from "./pds";

test.describe("メンバー", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await login(page);
  });

  test("members-1: 左カラムの「メンバー」から、中央カラムにメンバー（名前、ハンドル）を一覧表示する", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "メンバー", exact: true }).click();

    await expect(page).toHaveURL("/members");
    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(async () => {
      await page.reload();
      await expect(alice).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(alice.getByText("@alice.test")).toBeVisible();
  });

  test("members-2: 一覧のユーザーを選ぶと、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    await page.goto("/members");

    await page
      .getByRole("main")
      .getByRole("link", { name: /^Alice/ })
      .click();

    await expect(page).toHaveURL(/\/members\?profile=/);
    const panel = page.getByRole("region", { name: "プロフィール" });
    await expect(panel.getByText("Alice")).toBeVisible();
  });
});
