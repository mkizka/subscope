import { expect, test } from "@playwright/test";

test.describe("設定", () => {
  test("settings-e2: 「アカウント管理」は、ログインに使った認可サーバーの `/account` を新しいタブで開くリンクにする", async ({
    page,
  }) => {
    await page.goto("/settings");

    const link = page
      .getByRole("main")
      .getByRole("link", { name: "アカウント管理" });
    await expect(link).toHaveAttribute("href", "http://localhost:2583/account");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("settings-e3: 「ログアウト」を押すと、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/settings");

    await page.getByRole("button", { name: "ログアウト" }).click();

    await expect(page).toHaveURL("/login");
  });
});

test.describe("設定（未ログイン）", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("settings-e1: ログインしていない場合、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/settings");

    await expect(page).toHaveURL("/login");
  });
});
