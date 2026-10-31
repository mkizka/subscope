import { expect, test } from "@playwright/test";

import { login } from "./login";

test.describe("ログイン", () => {
  test("login-2: ログインしていないときにトップページを開くと、ログイン画面に移動する", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/login");
  });

  test("login-3: 管理者がまだいないサーバーでは、最初にログインしたアカウントが管理者になることをログイン画面に出す", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByText(
        "最初にログインしたアカウントがこのサーバーの管理者になります",
      ),
    ).toBeVisible();
  });

  test("login-1: 最初にログインしたアカウントを管理者として登録する", async ({
    page,
  }) => {
    await login(page);

    await expect(
      page.getByRole("navigation").getByRole("link", { name: "登録ユーザー" }),
    ).toBeVisible();
  });

  test("login-4: サブスクライバーでないアカウントでログインすると、ログイン画面で招待コードの入力を求める", async ({
    page,
  }) => {
    await login(page, "bob.test", "/login");

    await expect(page.getByLabel("招待コード")).toBeVisible();
  });

  test("login-5: 無効な招待コードを入力すると「招待コードが無効または期限切れです」と出す", async ({
    page,
  }) => {
    await login(page, "bob.test", "/login");

    await page.getByLabel("招待コード").fill("invalid-code");
    await page.getByRole("button", { name: "登録する" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "招待コードが無効または期限切れです",
    );
  });

  test("login-8: 招待コードの入力を求めるときは「ログイン」「招待コード」の2段階の手順を出し、今が「招待コード」の段階であることを示す", async ({
    page,
  }) => {
    await login(page, "bob.test", "/login");

    const steps = page.getByRole("list", { name: "手順" });
    await expect(steps.getByRole("listitem")).toHaveText([
      "ログイン",
      "招待コード",
    ]);
    await expect(steps.locator('[aria-current="step"]')).toHaveText(
      "招待コード",
    );
  });
  test("login-6: 有効な招待コードを入力すると、サブスクライバーとして登録してタイムラインに移動する", async ({
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

  test("login-7: ログイン画面には、Blueskyのアカウントでログインする招待制のサーバーであることを出す", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByText(
        "招待制のBluesky互換サーバーです。Blueskyのアカウントでログインします。",
      ),
    ).toBeVisible();
  });
});
