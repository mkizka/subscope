import { expect, test } from "@playwright/test";

import { PDS_URL, resolveHandle } from "../../helpers/pds";

const image = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
});

test.describe("投稿欄", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "いまどうしてる？" }).click();
  });

  test("post-form-1: 畳んだ投稿欄はクリックで広がり、投稿した内容を再読み込みなしでタイムラインの一番下に表示する", async ({
    page,
    request,
  }) => {
    const session = await request.post(
      `${PDS_URL}/xrpc/com.atproto.server.createSession`,
      { data: { identifier: "alice.test", password: "password" } },
    );
    const { did, accessJwt } = await session.json();
    await request.post(`${PDS_URL}/xrpc/com.atproto.repo.putRecord`, {
      headers: { Authorization: `Bearer ${accessJwt}` },
      data: {
        repo: did,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record: { displayName: "Alice" },
      },
    });
    const text = `post-form-1: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(page.getByText(/^post-form-1: /).last()).toHaveText(text);
  });

  test("post-form-2: 300字を超えると投稿できない", async ({ page }) => {
    const textbox = page.getByRole("textbox", { name: "投稿内容" });
    const submit = page.getByRole("button", { name: "投稿", exact: true });

    await textbox.fill("あ".repeat(300));
    await expect(submit).toBeEnabled();
    await textbox.fill("あ".repeat(301));
    await expect(submit).toBeDisabled();
  });

  test("post-form-3: 画像にALTを付けて添付でき、タイムラインの投稿にALT付きで表示する", async ({
    page,
  }) => {
    const alt = `post-form-3: ${Date.now()}`;
    await page.getByLabel("画像を追加").setInputFiles(image("a.png"));
    await page.getByRole("textbox", { name: "画像1のALT" }).fill(alt);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(page.getByRole("img", { name: alt })).toBeAttached();
  });

  test("post-form-4: 画像は4枚まで添付できる", async ({ page }) => {
    const input = page.getByLabel("画像を追加");
    await input.setInputFiles(
      ["1", "2", "3", "4"].map((n) => image(`${n}.png`)),
    );

    await expect(page.getByRole("textbox", { name: /のALT$/ })).toHaveCount(4);
    await expect(input).toBeDisabled();
  });
  test("post-form-5: 返信できる人の設定は、投稿と同じrkeyのthreadgateに保存する", async ({
    page,
    request,
  }) => {
    const text = `post-form-5: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("checkbox", { name: "フォロワー" }).check();
    await page.getByRole("checkbox", { name: "メンションした人" }).check();
    await page.getByRole("button", { name: "投稿", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "いまどうしてる？" }),
    ).toBeVisible();

    const did = await resolveHandle("alice.test");
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
