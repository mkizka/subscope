import { expect, test } from "@playwright/test";

import { login } from "./login";

test.describe("ログイン", () => {
  test("login-1: 最初にログインしたアカウントが管理者として登録される", async ({
    page,
  }) => {
    await login(page);

    await expect(
      page.getByRole("heading", { name: "登録が完了しました" }),
    ).toBeVisible();
  });
});
