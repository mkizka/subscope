import { expect, test } from "@playwright/test";

import { login } from "./login";

test.describe("レイアウト", () => {
  test("layout-1: 左カラムのメニューで、今いるページの項目を強調する", async ({
    page,
  }) => {
    await login(page);

    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nav.getByRole("link", { name: "メンバー" }).click();

    await expect(nav.getByRole("link", { name: "メンバー" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "ホーム" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("layout-2: 左カラムのアカウント欄の⋯から「ログアウト」すると、ログイン画面に移動する", async ({
    page,
  }) => {
    await login(page);

    const nav = page.getByRole("navigation");
    await nav.getByRole("button", { name: "アカウントメニュー" }).click();
    await nav.getByRole("button", { name: "ログアウト" }).click();

    await expect(page).toHaveURL("/login");
  });
});
