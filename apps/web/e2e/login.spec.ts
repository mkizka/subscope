import { expect, test } from "@playwright/test";

test.describe("ログイン", () => {
  test("login-1: 最初にログインしたアカウントが管理者として登録される", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("ハンドル").fill("alice.test");
    await page.getByRole("button", { name: "ログイン" }).click();
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("button", { name: "Authorize" }).click();

    await expect(
      page.getByRole("heading", { name: "登録が完了しました" }),
    ).toBeVisible();
  });
});
