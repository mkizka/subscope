import { expect, test } from "@playwright/test";

import { putRecord } from "../../helpers/pds";

test.describe("メンバー", () => {
  test.beforeEach(async ({ page }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "Blueskyを使っています",
    });
    await page.goto("/");
  });

  test("members-1: 左カラムの「メンバー」から、中央カラムにメンバー（名前、ハンドル、自己紹介）を一覧表示する", async ({
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
      await expect(alice.getByText("Blueskyを使っています")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(alice.getByText(/^@/)).toBeVisible();
  });

  test("members-2: 一覧のユーザーを選ぶと、そのユーザーのプロフィール全体ページに移動する", async ({
    page,
  }) => {
    await page.goto("/members");

    await page
      .getByRole("main")
      .getByRole("link", { name: /^Alice/ })
      .click();

    await expect(page).toHaveURL(/\/profile\/[^/]+$/);
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: "Alice", exact: true }),
    ).toBeVisible();
  });

  test("members-3: 見出しにメンバーの人数を表示する", async ({ page }) => {
    await page.goto("/members");

    await expect(
      page.getByRole("heading", { name: /^メンバー \d+人$/ }),
    ).toBeVisible();
  });

  test("members-4: 管理者のメンバーには「管理者」バッジを表示する", async ({
    page,
  }) => {
    await page.goto("/members");

    const alice = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Alice" });
    await expect(alice.getByText("管理者")).toBeVisible();
  });
});
