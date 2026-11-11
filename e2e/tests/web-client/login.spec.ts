import { expect, test } from "@playwright/test";

import { login, register } from "../../helpers/login";

test.describe("ログイン", () => {
  test("login-e2: ログインしていないときにトップページを開くと、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/login");
  });

  test("login-e1: 最初にログインしたアカウントを管理者として登録する", async ({
    page,
  }) => {
    await login(page);

    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: "アカウント管理" }),
    ).toBeVisible();
  });

  test("login-e3: メンバーでないアカウントでログインすると、ログイン画面で招待コードの入力を求める", async ({
    page,
  }) => {
    await login(page, "bob.test", "/login");

    await expect(page.getByLabel("招待コード")).toBeVisible();
  });

  test("login-e4: 無効な招待コードを入力すると「招待コードが無効または期限切れです」と出す", async ({
    page,
  }) => {
    await login(page, "bob.test", "/login");

    await page.getByLabel("招待コード").fill("invalid-code");
    await page.getByRole("button", { name: "登録する" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "招待コードが無効または期限切れです",
    );
  });

  test("login-e5: 有効な招待コードを入力すると、メンバーとして登録してタイムラインに移動する", async ({
    page,
    browser,
  }) => {
    const adminPage = await browser.newPage();
    await login(adminPage);
    const response = await adminPage.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await adminPage.close();
    await login(page, "bob.test", "/login");

    await page.getByLabel("招待コード").fill(code);
    await page.getByRole("button", { name: "登録する" }).click();

    await page.waitForURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("login-e6: 「新規登録」タブで有効な招待コードを入力してログインすると、メンバーとして登録してタイムラインに移動する", async ({
    page,
    browser,
  }) => {
    const adminPage = await browser.newPage();
    await login(adminPage);
    const response = await adminPage.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await adminPage.close();

    await register(page, "carol.test", code);

    await page.waitForURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("login-e7: 「新規登録」タブで無効な招待コードを入力してログインすると、招待コードの入力画面に戻って「招待コードが無効または期限切れです」と出す", async ({
    page,
  }) => {
    await register(page, "erin.test", "invalid-code");

    await page.waitForURL("/login?error=invalid_invite_code");
    await expect(page.getByRole("alert")).toHaveText(
      "招待コードが無効または期限切れです",
    );
  });
});
