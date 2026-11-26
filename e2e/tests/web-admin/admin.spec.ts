import { expect, type Page, request, test } from "@playwright/test";

import { login } from "../../helpers/login";
import { registerAccount, resolveHandle } from "../../helpers/pds";

const ADMIN_API_TOKEN = "sP3M1s3vK7jvA0pZ2bUuC5mD8qL4xN6tR9wE1yH0aB2c";

test.describe("管理画面へのアクセス", () => {
  test("admin-e1: 管理者にだけ、左カラムの「サーバー管理」に「アカウント管理」「招待コード」「ジョブキュー」を出す", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await expect(
      nav.getByRole("link", { name: "アカウント管理" }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "招待コード" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "ジョブキュー" })).toBeVisible();
  });

  test("admin-e2: 管理者でないアカウントが管理画面を開くと403エラーを出す", async ({
    page,
    browser,
  }) => {
    await page.goto("/");
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await registerAccount("heidi.test", code);
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const memberPage = await context.newPage();
    await login(memberPage, { handle: "heidi.test" });

    await memberPage.goto("/admin/server-members");

    await expect(memberPage.getByText("403")).toBeVisible();
    await context.close();
  });
});

test.describe("ジョブキュー", () => {
  test("bullBoard-e1: 左カラムの「ジョブキュー」は、新しいタブで開くことが分かるアイコンを付け、新しいタブで開く", async ({
    page,
  }) => {
    await page.goto("/");

    const link = page
      .getByRole("navigation")
      .getByRole("link", { name: "ジョブキュー" });
    await expect(link.getByTestId("external-link-icon")).toBeVisible();
    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/admin\/bull-board/);
  });

  test("bullBoard-e2: `ADMIN_API_TOKEN` を付けると、ログインせずにジョブキューのAPIをGETで読める", async ({
    baseURL,
  }) => {
    const context = await request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_API_TOKEN}` },
    });

    const response = await context.get(
      "/admin/bull-board/api/queues?activeQueue=fetchRecord&status=failed",
    );

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      queues: expect.arrayContaining([
        expect.objectContaining({
          name: "fetchRecord",
          counts: expect.any(Object),
        }),
      ]),
    });
  });

  test("bullBoard-e3: `ADMIN_API_TOKEN` では、ジョブキューのAPIをGET以外で呼べない", async ({
    baseURL,
  }) => {
    const context = await request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_API_TOKEN}` },
    });

    const response = await context.put(
      "/admin/bull-board/api/queues/fetchRecord/clean/completed",
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe("/login");
  });
});

test.describe("メンバー", () => {
  test("adminAccounts-e1: メンバーを新しい順に並べ、名前・ハンドル・管理者かどうか・登録日を出す", async ({
    page,
  }) => {
    await page.goto("/");
    const aliceDid = await resolveHandle("alice.test");

    await page.goto("/admin/server-members");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(aliceDid) });
    await expect(row.getByText("管理者")).toBeVisible();
    await expect(row.getByText(/\d{4}\/\d{2}\/\d{2} 登録/)).toBeVisible();
  });

  test("adminAccounts-e3: 管理者でないメンバーは、確認のうえ「管理者にする」で管理者にできる", async ({
    page,
  }) => {
    await page.goto("/");
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await registerAccount("bob.test", code);
    const bobDid = await resolveHandle("bob.test");

    await page.goto("/admin/server-members");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(bobDid) });

    await row.getByRole("button", { name: "操作" }).click();
    await row.getByRole("button", { name: "管理者にする" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "管理者にする" })
      .click();

    await expect(row.getByText("管理者", { exact: true })).toBeVisible();
  });

  test("adminAccounts-e2: 管理者でないメンバーは、確認のうえ「メンバーから外す」で登録を解除でき、そのアカウントは招待コードで再登録できる", async ({
    page,
  }) => {
    await page.goto("/");
    const createInviteCode = async () => {
      const response = await page.request.post("/admin/api/invite-codes");
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return ((await response.json()) as { code: string }).code;
    };
    await registerAccount("dave.test", await createInviteCode());
    const daveDid = await resolveHandle("dave.test");

    await page.goto("/admin/server-members");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(daveDid) });

    await row.getByRole("button", { name: "操作" }).click();
    await row.getByRole("button", { name: "メンバーから外す" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "外す" })
      .click();

    await expect(row).toHaveCount(0);
    await registerAccount("dave.test", await createInviteCode());
  });

  test("adminAccounts-e7: 追加ダイアログで入力したアカウントを、本人のログインなしでメンバーにして一覧の先頭に出す", async ({
    page,
  }) => {
    const graceDid = await resolveHandle("grace.test");

    await page.goto("/admin/server-members");
    await page.getByRole("button", { name: "メンバーを追加" }).click();
    const dialog = page.getByRole("dialog", { name: "メンバーを追加" });
    await dialog.getByLabel("ハンドルまたはDID").fill("grace.test");
    await dialog.getByRole("button", { name: "追加する" }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("main").getByRole("listitem").first().getByTitle(graceDid),
    ).toBeVisible();
  });

  test("adminAccounts-e8: メンバーに追加できないときは、ダイアログを閉じずに理由（見つからない・すでにメンバー）を出す", async ({
    page,
  }) => {
    await page.goto("/admin/server-members");
    await page.getByRole("button", { name: "メンバーを追加" }).click();
    const dialog = page.getByRole("dialog", { name: "メンバーを追加" });
    await dialog.getByLabel("ハンドルまたはDID").fill("alice.test");
    await dialog.getByRole("button", { name: "追加する" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("すでにメンバーです");
    await expect(dialog).toBeVisible();
  });
});

test.describe("招待コード", () => {
  const inviteCodeRows = (page: Page) =>
    page.getByRole("list", { name: "招待コード" }).getByRole("listitem");

  const createInviteCode = async (page: Page) => {
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return ((await response.json()) as { code: string }).code;
  };

  test("inviteCodes-e1: 招待コードを新しい順に並べ、コード・状態（未使用・使用済み・期限切れ）・使用者・有効期限・作成日を出す", async ({
    page,
  }) => {
    await page.goto("/");
    const older = await createInviteCode(page);
    const newer = await createInviteCode(page);

    await page.goto("/admin/invite-codes");

    const rows = inviteCodeRows(page);
    await expect(rows.nth(0)).toContainText(newer);
    await expect(rows.nth(0)).toContainText("未使用");
    await expect(rows.nth(1)).toContainText(older);
  });

  test("inviteCodes-e2: 一覧の下までスクロールすると続きを読み込む", async ({
    page,
  }) => {
    await page.goto("/");
    const oldest = await createInviteCode(page);
    for (let i = 0; i < 20; i++) {
      await createInviteCode(page);
    }

    await page.goto("/admin/invite-codes");
    await expect(page.getByText(oldest, { exact: true })).toHaveCount(0);

    await inviteCodeRows(page).last().scrollIntoViewIfNeeded();

    await expect(page.getByText(oldest, { exact: true })).toBeVisible();
  });

  test("inviteCodes-e3: 「新規作成」で有効期限7日の招待コードを作り、一覧の先頭に出す", async ({
    page,
  }) => {
    await page.goto("/");
    const existing = await createInviteCode(page);
    await page.goto("/admin/invite-codes");
    const firstRow = inviteCodeRows(page).first();
    await expect(firstRow).toContainText(existing);

    await page.getByRole("button", { name: "新規作成" }).click();

    await expect(firstRow).not.toContainText(existing);
    await expect(firstRow).toContainText("未使用");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await expect(firstRow).toContainText(
      expiresAt.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  });

  test("inviteCodes-e4: 未使用で期限内の招待コードは確認のうえ削除できる", async ({
    page,
  }) => {
    await page.goto("/");
    const code = await createInviteCode(page);

    await page.goto("/admin/invite-codes");
    const row = inviteCodeRows(page).filter({ hasText: code });

    await row.getByRole("button", { name: "削除" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(code);
    await dialog.getByRole("button", { name: "削除する" }).click();

    await expect(row).toHaveCount(0);
  });

  test("inviteCodes-e5: 期限切れの招待コードは確認せずに削除できる", async ({
    page,
  }) => {
    await page.goto("/");
    const code = await createInviteCode(page);
    await page.clock.setFixedTime(Date.now() + 8 * 24 * 60 * 60 * 1000);

    await page.goto("/admin/invite-codes");
    const row = inviteCodeRows(page).filter({ hasText: code });
    await row.getByRole("button", { name: "削除" }).click();

    await expect(row).toHaveCount(0);
  });
});
