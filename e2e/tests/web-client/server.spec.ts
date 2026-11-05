import { expect, test } from "@playwright/test";

test.describe("サーバー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/server");
  });

  test("server-1: サーバー名・招待制であること・サーバーの説明を表示する", async ({
    page,
  }) => {
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Subscope" })).toBeVisible();
    await expect(main.getByText("招待制", { exact: true })).toBeVisible();
    await expect(
      main.getByText("登録アカウントとそのフォロー先の投稿だけを保存します"),
    ).toBeVisible();
  });

  test("server-2: 「アカウント」に、登録アカウントと追跡アカウントの数を小さめの文字で表示し、それぞれ一覧（`/server/accounts`、追跡は `?tab=tracked`）へのリンクにする", async ({
    page,
  }) => {
    const main = page.getByRole("main");
    await expect(
      main.getByRole("link", { name: /^登録アカウント \d+\+? ›$/ }),
    ).toHaveAttribute("href", "/server/accounts");
    await expect(
      main.getByRole("link", { name: /^追跡アカウント \d+ ›$/ }),
    ).toHaveAttribute("href", "/server/accounts?tab=tracked");
  });

  test("server-3: 「アカウント」の「追跡アカウントとは？」を押すと、追跡アカウントの説明をモーダルで表示する", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "追跡アカウントとは？" }).click();

    await expect(
      page
        .getByRole("dialog", { name: "追跡アカウント" })
        .getByText("1人以上からフォローされているアカウント"),
    ).toBeVisible();
  });

  test("server-4: 「上級者向け」に、サーバーDID `did:web:{ホスト}#bsky_appview` を表示する", async ({
    page,
  }) => {
    await expect(page.getByText("サーバーDID", { exact: true })).toBeVisible();
    await expect(page.getByText(/^did:web:.+#bsky_appview$/)).toBeVisible();
  });

  test("server-5: サーバーDIDの横のボタンで、サーバーDIDをクリップボードにコピーできる", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const did = await page.getByText(/^did:web:.+#bsky_appview$/).textContent();

    await page.getByRole("button", { name: "コピー" }).click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(did);
  });
});
