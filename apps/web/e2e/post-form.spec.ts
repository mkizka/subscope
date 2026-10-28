import { expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

test.describe("投稿欄", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "いまどうしてる？" }).click();
  });

  test("post-form-1: 畳んだ投稿欄をクリックすると広がり、投稿した内容がタイムラインの一番下に表示される", async ({
    page,
  }) => {
    const text = `post-form-1: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^post-form-1: /).last()).toHaveText(text, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("post-form-2: 300字を超えると投稿ボタンを押せない", async ({ page }) => {
    const textbox = page.getByRole("textbox", { name: "投稿内容" });
    const submit = page.getByRole("button", { name: "投稿", exact: true });

    await textbox.fill("あ".repeat(300));
    await expect(submit).toBeEnabled();
    await textbox.fill("あ".repeat(301));
    await expect(submit).toBeDisabled();
  });

  test("post-form-3: 返信できる人を選んで投稿すると、投稿と同じrkeyのthreadgateにその設定が保存される", async ({
    page,
    request,
  }) => {
    const text = `post-form-3: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("checkbox", { name: "フォロワー" }).check();
    await page.getByRole("checkbox", { name: "メンションした人" }).check();
    await page.getByRole("button", { name: "投稿", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "いまどうしてる？" }),
    ).toBeVisible();

    const resolved = await request.get(
      `${PDS_URL}/xrpc/com.atproto.identity.resolveHandle`,
      { params: { handle: "alice.test" } },
    );
    const { did } = await resolved.json();
    const threadgates = await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords`,
      {
        params: {
          repo: did,
          collection: "app.bsky.feed.threadgate",
          limit: 1,
        },
      },
    );
    const {
      records: [threadgate],
    }: { records: [{ uri: string; value: { allow: unknown } }] } =
      await threadgates.json();
    expect(threadgate.value.allow).toEqual([
      { $type: "app.bsky.feed.threadgate#followerRule" },
      { $type: "app.bsky.feed.threadgate#mentionRule" },
    ]);
    const postRecord = await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.getRecord`,
      {
        params: {
          repo: did,
          collection: "app.bsky.feed.post",
          rkey: threadgate.uri.replace(/.*\//, ""),
        },
      },
    );
    const { value }: { value: { text: string } } = await postRecord.json();
    expect(value.text).toBe(text);
  });
});
