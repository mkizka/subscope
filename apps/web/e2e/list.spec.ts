import { expect, test } from "@playwright/test";

import { createRecord, follow, resolveHandle } from "./pds";

const createList = async (name: string) => {
  const bob = await resolveHandle("bob.test");
  await follow("alice.test", "bob.test");
  const list = await createRecord("alice.test", "app.bsky.graph.list", {
    purpose: "app.bsky.graph.defs#curatelist",
    name,
    description: `${name}の説明`,
    createdAt: new Date().toISOString(),
  });
  await createRecord("alice.test", "app.bsky.graph.listitem", {
    subject: bob,
    list: list.uri,
    createdAt: new Date().toISOString(),
  });
  return list.uri.split("/").at(-1);
};

test.describe("リスト", () => {
  test("list-1: プロフィール全体ページの「リスト」から、そのユーザーが作成したリスト（名前、説明）を一覧表示する", async ({
    page,
  }) => {
    const name = `list-1のリスト ${Date.now()}`;
    await createList(name);
    await page.goto("/profile/alice.test");

    await page.getByRole("main").getByRole("tab", { name: "リスト" }).click();

    await expect(page).toHaveURL("/profile/alice.test/lists");
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

  test("list-2: 一覧のリストを選ぶと、リストの名前と説明、リストのメンバーの投稿を新しい順に表示する", async ({
    page,
  }) => {
    const name = `list-2のリスト ${Date.now()}`;
    const rkey = await createList(name);
    const older = `list-2の古い投稿 ${Date.now()}`;
    const newer = `list-2の新しい投稿 ${Date.now()}`;
    for (const text of [older, newer]) {
      await createRecord("bob.test", "app.bsky.feed.post", {
        text,
        createdAt: new Date().toISOString(),
      });
    }
    await page.goto("/profile/alice.test/lists");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(name, { exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByText(name, { exact: true }).click();

    await expect(page).toHaveURL(`/profile/alice.test/lists/${rkey}`);
    await expect(main.getByRole("heading", { name })).toBeVisible();
    await expect(main.getByText(`${name}の説明`)).toBeVisible();
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(newer)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(main.getByText(/^list-2の(古い|新しい)投稿/)).toHaveText([
      newer,
      older,
    ]);
  });

  test("list-3: リスト詳細の「メンバー」タブで、リストに追加されたユーザーを一覧表示する", async ({
    page,
  }) => {
    const rkey = await createList(`list-3のリスト ${Date.now()}`);
    await page.goto(`/profile/alice.test/lists/${rkey}`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByRole("tab", { name: "メンバー" })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await main.getByRole("tab", { name: "メンバー" }).click();

    await expect(main.getByText("@bob.test")).toBeVisible();
  });
});
