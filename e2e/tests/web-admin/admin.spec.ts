import { expect, type Page, request, test } from "@playwright/test";

import { login } from "../../helpers/login";
import {
  putRecord,
  registerAccount,
  resolveHandle,
  uploadImage,
} from "../../helpers/pds";

const ADMIN_API_TOKEN = "sP3M1s3vK7jvA0pZ2bUuC5mD8qL4xN6tR9wE1yH0aB2c";

test.describe("管理画面へのアクセス", () => {
  test("admin-1: 左カラムのメニューの下の「サーバー管理」に、管理者にだけ「アカウント管理」「招待コード」「ジョブキュー」を出す", async ({
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

  test("admin-2: 管理者でないアカウントが管理画面のURLを開くと403エラーを出す", async ({
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
    await login(memberPage, "heidi.test");

    await memberPage.goto("/admin/registered-accounts");

    await expect(memberPage.getByText("403")).toBeVisible();
    await context.close();
  });
});

test.describe("ジョブキュー", () => {
  test("bull-board-e1: 左カラムの「ジョブキュー」は、新しいタブを開くことが分かるアイコンを付け、新しいタブで開く", async ({
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

  test("bull-board-e2: `Authorization: Bearer {ADMIN_API_TOKEN}` を付けると、ログインせずに bull-board のAPI(`/admin/bull-board/api/` 以下)をGETで読める", async ({
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

  test("bull-board-e3: `ADMIN_API_TOKEN` では、bull-board のAPIをGET以外で呼べない", async ({
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
  test("admin-accounts-1: メンバーを新しい順に1人1行で並べ、名前・ハンドル・管理者かどうか・登録日を出す", async ({
    page,
  }) => {
    await page.goto("/");
    const aliceDid = await resolveHandle("alice.test");

    await page.goto("/admin/registered-accounts");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(aliceDid) });
    await expect(row.getByText("管理者")).toBeVisible();
    await expect(row.getByText(/\d{4}\/\d{2}\/\d{2} 登録/)).toBeVisible();
  });

  test("admin-accounts-4: 見出しの横にメンバーの人数を出す", async ({
    page,
  }) => {
    await page.goto("/admin/registered-accounts");

    await expect(page.getByRole("main").getByText(/^\d+人$/)).toBeVisible();
  });

  test("admin-accounts-3: 管理者でないメンバーを、行の右端のメニューから確認のうえ「管理者にする」で管理者にできる", async ({
    page,
  }) => {
    await page.goto("/");
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await registerAccount("bob.test", code);
    const bobDid = await resolveHandle("bob.test");

    await page.goto("/admin/registered-accounts");

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

  test("admin-accounts-2: 管理者でないメンバーを、行の右端のメニューから確認のうえ「サーバー登録を停止する」と登録を解除し、そのアカウントは招待コードで再登録できなくなる", async ({
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

    await page.goto("/admin/registered-accounts");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(daveDid) });

    await row.getByRole("button", { name: "操作" }).click();
    await row.getByRole("button", { name: "サーバー登録を停止する" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "停止する" })
      .click();

    await expect(row).toHaveCount(0);
    await expect(
      registerAccount("dave.test", await createInviteCode()),
    ).rejects.toThrow("Banned");
  });

  const banAccount = async (page: Page, handle: string) => {
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await registerAccount(handle, code);
    const did = await resolveHandle(handle);
    await page.request.delete("/admin/api/registered-accounts", {
      data: { did },
    });
    return did;
  };

  test("admin-accounts-5: 「メンバー」「停止中」のタブで一覧を切り替える", async ({
    page,
  }) => {
    await page.goto("/");
    const aliceDid = await resolveHandle("alice.test");

    await page.goto("/admin/registered-accounts");
    await page.getByRole("tab", { name: "停止中" }).click();

    await expect(page.getByRole("tab", { name: "停止中" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTitle(aliceDid)).toHaveCount(0);

    await page.getByRole("tab", { name: "メンバー" }).click();

    await expect(page.getByTitle(aliceDid)).toBeVisible();
  });

  test("admin-accounts-8: 選んだタブをURLに残し、そのURLを開くと同じタブを出す", async ({
    page,
  }) => {
    await page.goto("/admin/registered-accounts");
    await page.getByRole("tab", { name: "停止中" }).click();
    await page.reload();

    await expect(page.getByRole("tab", { name: "停止中" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("admin-accounts-9: 「メンバー」タブの各行に、本人の過去の投稿の同期状態を「同期済み」「同期中」「同期エラー」のバッジで出す", async ({
    page,
  }) => {
    await page.goto("/");
    const aliceDid = await resolveHandle("alice.test");

    await expect(async () => {
      await page.goto("/admin/registered-accounts");
      const row = page
        .getByRole("main")
        .getByRole("listitem")
        .filter({ has: page.getByTitle(aliceDid) });
      await expect(row.getByText("同期済み")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("admin-accounts-10: メンバーの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/admin/api/registered-accounts*", async (route) => {
      await released;
      await route.continue();
    });

    await page.goto("/admin/registered-accounts");

    await expect(
      page.getByRole("heading", { name: "アカウント管理" }),
    ).toBeVisible();
    const skeleton = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("admin-accounts-6: 「停止中」タブには、サーバー登録を停止したアカウントを1人1行で並べ、名前・ハンドルを出す", async ({
    page,
  }) => {
    await page.goto("/");
    const graceDid = await banAccount(page, "grace.test");

    await page.goto("/admin/registered-accounts");

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(graceDid) });
    await page.getByRole("tab", { name: "停止中" }).click();

    await expect(row.getByTitle(graceDid)).toBeVisible();
  });

  test("admin-accounts-7: 停止中のアカウントを、行の「登録を再開する」から確認のうえ再開すると一覧から消え、そのアカウントは招待コードで再登録できるようになる", async ({
    page,
  }) => {
    await page.goto("/");
    const frankDid = await banAccount(page, "frank.test");

    await page.goto("/admin/registered-accounts");
    await page.getByRole("tab", { name: "停止中" }).click();

    const row = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByTitle(frankDid) });
    await row.getByRole("button", { name: "登録を再開する" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "再開する" })
      .click();

    await expect(row).toHaveCount(0);
    const response = await page.request.post("/admin/api/invite-codes");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { code } = (await response.json()) as { code: string };
    await registerAccount("frank.test", code);
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

  test("invite-codes-1: 招待コードを新しい順に並べ、コード・状態（未使用・使用済み・期限切れ）・使用者・有効期限・作成日を出す", async ({
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

  test("invite-codes-9: 招待コードの一覧を開くと、読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/admin/registered-accounts");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/admin/api/invite-codes*", async (route) => {
      await released;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "招待コード" })
      .click();

    await expect(
      page.getByRole("heading", { name: "招待コード" }),
    ).toBeVisible();
    const skeleton = page.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("invite-codes-2: 一覧の下までスクロールすると続きを読み込む", async ({
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

  test("invite-codes-3: 「新規作成」で有効期限7日の招待コードを作り、一覧の先頭に出す", async ({
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

  test("invite-codes-4: 未使用で期限内の招待コードは、確認のうえ削除できる", async ({
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

  test("invite-codes-5: 使用済みの招待コードは削除できない", async ({
    page,
  }) => {
    await page.goto("/");
    const code = await createInviteCode(page);
    await registerAccount("carol.test", code);

    await page.goto("/admin/invite-codes");
    const row = inviteCodeRows(page).filter({ hasText: code });

    await expect(row).toContainText("使用済み");
    await expect(row.getByRole("button", { name: "削除" })).toHaveCount(0);
  });

  test("invite-codes-8: 使用済みの招待コードには、使用者のアバターと名前を出す", async ({
    page,
  }) => {
    await putRecord("erin.test", "app.bsky.actor.profile", "self", {
      displayName: "Erin",
      avatar: await uploadImage("erin.test"),
    });
    await page.goto("/");
    const code = await createInviteCode(page);
    await registerAccount("erin.test", code);

    const row = inviteCodeRows(page).filter({ hasText: code });
    await expect(async () => {
      await page.goto("/admin/invite-codes");
      await expect(row).toContainText("Erin が使用", { timeout: 1000 });
      await expect(row.locator("img")).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("invite-codes-6: 期限切れの招待コードは確認せずに削除できる", async ({
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

  test("invite-codes-7: 未使用で期限内の招待コードは、コードの横のボタンでコードをクリップボードにコピーできる", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const code = await createInviteCode(page);

    await page.goto("/admin/invite-codes");
    const row = inviteCodeRows(page).filter({ hasText: code });
    await row.getByRole("button", { name: "コピー" }).click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(code);
  });
});
