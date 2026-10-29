import { expect, test } from "@playwright/test";

import { login } from "./login";

test.describe("ログイン", () => {
  test("login-1: 最初にログインしたアカウントを管理者として登録する", async ({
    page,
  }) => {
    await login(page);

    await expect(
      page.getByRole("navigation").getByRole("link", { name: "登録ユーザー" }),
    ).toBeVisible();
  });
});
