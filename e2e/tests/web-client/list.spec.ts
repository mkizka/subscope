import { expect, test } from "@playwright/test";

import {
  createRecord,
  follow,
  PDS_URL,
  resolveHandle,
} from "../../helpers/pds";

const createEmptyList = async (name: string) => {
  await follow("alice.test", "bob.test");
  return createRecord("alice.test", "app.bsky.graph.list", {
    purpose: "app.bsky.graph.defs#curatelist",
    name,
    description: `${name}の説明`,
    createdAt: new Date().toISOString(),
  });
};

const createList = async (name: string) => {
  const bob = await resolveHandle("bob.test");
  const list = await createEmptyList(name);
  await createRecord("alice.test", "app.bsky.graph.listitem", {
    subject: bob,
    list: list.uri,
    createdAt: new Date().toISOString(),
  });
  return list.uri.split("/").at(-1);
};

test.describe("リスト", () => {
  test("list-e1: プロフィール全体ページの「リスト」から、そのアカウントが作成したリスト（名前、説明）を一覧表示する", async ({
    page,
  }) => {
    const name = `list-e1のリスト ${Date.now()}`;
    await createList(name);
    await page.goto("/alice.test");

    await page.getByRole("main").getByRole("tab", { name: "リスト" }).click();

    await expect(page).toHaveURL("/alice.test/lists");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
      await expect(main.getByText(`${name}の説明`)).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("list-e2: 一覧のリストを選ぶと、戻るボタンと作成者を含むヘッダー、リストの名前と説明、リストのメンバーの投稿を新しい順に表示する", async ({
    page,
  }) => {
    const name = `list-e2のリスト ${Date.now()}`;
    const rkey = await createList(name);
    const older = `list-e2の古い投稿 ${Date.now()}`;
    const newer = `list-e2の新しい投稿 ${Date.now()}`;
    for (const text of [older, newer]) {
      await createRecord("bob.test", "app.bsky.feed.post", {
        text,
        createdAt: new Date().toISOString(),
      });
    }
    await page.goto("/alice.test/lists");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByText(name, { exact: true }).click();

    await expect(page).toHaveURL(`/alice.test/lists/${rkey}`);
    await expect(main.getByRole("heading", { name })).toBeVisible();
    await expect(main.getByText(`${name}の説明`)).toBeVisible();
    await expect(main.getByRole("link", { name: "戻る" })).toBeVisible();
    await expect(main.getByText("@alice.test が作成")).toBeVisible();
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(newer)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(main.getByText(/^list-e2の(古い|新しい)投稿/)).toHaveText([
      newer,
      older,
    ]);
  });

  test("list-e3: リスト詳細の「メンバー」タブで、リストに追加されたアカウントを一覧表示する", async ({
    page,
  }) => {
    const rkey = await createList(`list-e3のリスト ${Date.now()}`);
    await page.goto(`/alice.test/lists/${rkey}`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByRole("tab", { name: "メンバー" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByRole("tab", { name: "メンバー" }).click();

    await expect(main.getByRole("tab", { name: "メンバー" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(main.getByText("@bob.test")).toBeVisible();
  });

  test("list-e4: 「リスト」の管理画面（`/lists`）で、「新しいリスト」ボタンのダイアログに名前と説明を入力してリストを作成する", async ({
    page,
  }) => {
    const name = `list-e4のリスト ${Date.now()}`;
    await page.goto("/lists");
    const main = page.getByRole("main");

    await main.getByRole("button", { name: "新しいリスト" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("名前").fill(name);
    await dialog.getByLabel("説明").fill(`${name}の説明`);
    const submitted = page.waitForResponse(
      (res) => res.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "作成する" }).click();
    await submitted;

    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
      await expect(main.getByText(`${name}の説明`)).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("list-e5: 自分のリスト詳細のヘッダーにある「…」メニューから編集ダイアログを開き、リストの名前と説明を編集する", async ({
    page,
  }) => {
    const rkey = await createList(`list-e5のリスト ${Date.now()}`);
    const name = `list-e5の編集後 ${Date.now()}`;
    await page.goto(`/alice.test/lists/${rkey}`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByRole("button", { name: "操作" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByRole("button", { name: "操作" }).click();
    await page.getByRole("button", { name: "編集する" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("名前").fill(name);
    await dialog.getByLabel("説明").fill(`${name}の説明`);
    const submitted = page.waitForResponse(
      (res) => res.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "保存する" }).click();
    await submitted;

    await expect(async () => {
      await page.reload();
      await expect(main.getByRole("heading", { name })).toBeVisible({
        timeout: 1000,
      });
      await expect(main.getByText(`${name}の説明`)).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("list-e6: 自分のリスト詳細のヘッダーにある「…」メニューから、確認のうえリストとリストのメンバーを削除し、リスト一覧に戻る", async ({
    page,
  }) => {
    const name = `list-e6のリスト ${Date.now()}`;
    const rkey = await createList(name);
    const alice = await resolveHandle("alice.test");
    await page.goto(`/alice.test/lists/${rkey}`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByRole("button", { name: "操作" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByRole("button", { name: "操作" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "削除する" })
      .click();

    await expect(page).toHaveURL("/alice.test/lists");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeHidden({
        timeout: 1000,
      });
    }).toPass();
    const response = await fetch(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=${alice}&collection=app.bsky.graph.listitem&limit=100`,
    );
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { records } = (await response.json()) as {
      records: { value: { list: string } }[];
    };
    expect(
      records.filter(
        ({ value }) =>
          value.list === `at://${alice}/app.bsky.graph.list/${rkey}`,
      ),
    ).toEqual([]);
  });

  test("list-e7: 自分のリストの「メンバー」タブで、ハンドルを入力したアカウントをリストに追加する", async ({
    page,
  }) => {
    const list = await createEmptyList(`list-e7のリスト ${Date.now()}`);
    const rkey = list.uri.split("/").at(-1);
    await page.goto(`/alice.test/lists/${rkey}?tab=members`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByLabel("ハンドル")).toBeVisible({ timeout: 1000 });
    }).toPass();

    await main.getByLabel("ハンドル").fill("bob.test");
    const submitted = page.waitForResponse((res) =>
      res.url().includes("/api/list-members"),
    );
    await main.getByRole("button", { name: "追加する" }).click();
    await submitted;

    await expect(async () => {
      await page.reload();
      await expect(main.getByText("@bob.test")).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("list-e8: 自分のリストの「メンバー」タブで、リストのメンバーをリストから削除する", async ({
    page,
  }) => {
    const rkey = await createList(`list-e8のリスト ${Date.now()}`);
    await page.goto(`/alice.test/lists/${rkey}?tab=members`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText("@bob.test")).toBeVisible({ timeout: 1000 });
    }).toPass();

    const submitted = page.waitForResponse((res) =>
      res.url().includes("/api/list-members"),
    );
    await main.getByRole("button", { name: "削除", exact: true }).click();
    await submitted;

    await expect(async () => {
      await page.reload();
      await expect(main.getByText("@bob.test")).toBeHidden({ timeout: 1000 });
    }).toPass();
  });

  test("list-e9: リストのメンバーの投稿はタイムラインと同じ規則でリプライを絞り込む", async ({
    page,
  }) => {
    const rkey = await createList(`list-e9のリスト ${Date.now()}`);
    const alicePost = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "list-e9: aliceの投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: "list-e9: aliceへの返信",
      reply: { root: alicePost, parent: alicePost },
      createdAt: new Date().toISOString(),
    });
    const root = await createRecord("bob.test", "app.bsky.feed.post", {
      text: "list-e9: bobの投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: "list-e9: bob自身への返信",
      reply: { root, parent: root },
      createdAt: new Date().toISOString(),
    });

    await page.goto(`/alice.test/lists/${rkey}`);

    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText("list-e9: bob自身への返信")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(main.getByText("list-e9: aliceへの返信")).toHaveCount(0);
  });

  test("list-e10: リスト一覧はプロフィールのヘッダーとタブの下に、表示中のアカウントが作成したリストだけを表示し、自分のプロフィールでも作成フォームは表示しない", async ({
    page,
  }) => {
    const name = `list-e10のリスト ${Date.now()}`;
    await createList(name);
    await page.goto("/alice.test/lists");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(main.getByRole("tab", { name: "リスト" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      main.getByRole("button", { name: "新しいリスト" }),
    ).toBeHidden();

    await page.goto("/bob.test/lists");

    await expect(main.getByText("@bob.test")).toBeVisible();
    await expect(
      page.getByRole("status", { name: "読み込み中", exact: true }),
    ).toBeHidden();
    await expect(main.getByText(name, { exact: true })).toBeHidden();
  });

  test("list-e11: サイドメニューの「リスト」から、自分のリストの管理画面（`/lists`）を開き、自分のリストを一覧表示する", async ({
    page,
  }) => {
    const name = `list-e11のリスト ${Date.now()}`;
    await createList(name);
    await page.goto("/");

    await page
      .getByRole("link", { name: "リスト", exact: true })
      .first()
      .click();

    await expect(page).toHaveURL("/lists");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });
});
