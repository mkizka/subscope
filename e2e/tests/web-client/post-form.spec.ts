import { expect, type Page, test } from "@playwright/test";

import { createRecord, PDS_URL, resolveHandle } from "../../helpers/pds";

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
    await expect(async () => {
      await page.getByRole("button", { name: "新規投稿" }).click();
      await expect(page.getByRole("textbox", { name: "投稿内容" })).toBeVisible(
        { timeout: 1000 },
      );
    }).toPass();
  });

  test("post-form-1: 新規投稿ボタンで投稿欄を開き、投稿すると投稿欄を閉じて、投稿した内容を再読み込みなしでタイムラインの一番上に表示する", async ({
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

    await expect(
      page.getByRole("textbox", { name: "投稿内容" }),
    ).not.toBeVisible();
    await expect(page.getByText(/^post-form-1: /).first()).toHaveText(text);
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
    await page.getByRole("button", { name: "誰でも返信できます" }).click();
    await page.getByRole("checkbox", { name: "フォロワー" }).check();
    await page.getByRole("checkbox", { name: "メンションした人" }).check();
    await page.getByRole("button", { name: "投稿", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "投稿内容" }),
    ).not.toBeVisible();

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

  test("post-form-6: 本文のURLとハッシュタグには、その範囲にfacetsを付ける", async ({
    page,
    request,
  }) => {
    const text = `post-form-6: ${Date.now()} 日本語 example.com/post-form-6 #subscope`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("button", { name: "投稿", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "投稿内容" }),
    ).not.toBeVisible();

    const did = await resolveHandle("alice.test");
    const posts = await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords`,
      { params: { repo: did, collection: "app.bsky.feed.post", limit: 20 } },
    );
    const {
      records,
    }: { records: { value: { text: string; facets: unknown } }[] } =
      await posts.json();
    const post = records.find((record) => record.value.text === text);
    const bytes = (s: string) => Buffer.byteLength(s);
    const urlStart = bytes(text.slice(0, text.indexOf("example.com")));
    const tagStart = bytes(text.slice(0, text.indexOf("#subscope")));
    expect(post?.value.facets).toEqual([
      {
        index: {
          byteStart: urlStart,
          byteEnd: urlStart + bytes("example.com/post-form-6"),
        },
        features: [
          {
            $type: "app.bsky.richtext.facet#link",
            uri: "https://example.com/post-form-6",
          },
        ],
      },
      {
        index: { byteStart: tagStart, byteEnd: tagStart + bytes("#subscope") },
        features: [{ $type: "app.bsky.richtext.facet#tag", tag: "subscope" }],
      },
    ]);
  });

  test("post-form-7: 入力欄に添えて、自分のアイコン・名前・ハンドルを表示する", async ({
    page,
  }) => {
    await expect(page.getByRole("dialog")).toContainText("@alice.test");
  });

  test("post-form-10: 返信できる人の設定は、入力欄の下にある今の設定を示すボタン(「誰でも返信できます」など)を押して選ぶ", async ({
    page,
  }) => {
    await expect(
      page.getByRole("radio", { name: "返信不可" }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "誰でも返信できます" }).click();
    await page.getByRole("radio", { name: "返信不可" }).check();
    await expect(page.getByRole("button", { name: "返信不可" })).toBeVisible();
  });
});

const openComposeFrom = async (page: Page, text: string, button: string) => {
  await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });
  await page.goto("/");
  const post = page.getByRole("article").filter({ hasText: text });
  await expect(async () => {
    await page.reload();
    await expect(post).toBeVisible({ timeout: 1000 });
  }).toPass();
  await post.getByRole("button", { name: button }).click();
  return page.getByRole("dialog");
};

test("post-form-8: 返信するときは、自分の名前の上に返信先の投稿の投稿者名・ハンドル・本文を表示し、投稿ボタンを「返信」にする", async ({
  page,
}) => {
  const text = `post-form-8: ${Date.now()}`;
  const dialog = await openComposeFrom(page, text, "返信");

  await expect(dialog.getByRole("article")).toContainText(text);
  await expect(dialog.getByRole("article")).toContainText("@alice.test");
  await expect(
    dialog.getByRole("button", { name: "返信", exact: true }),
  ).toBeVisible();
});

test("post-form-9: 引用するときは、入力欄の下に引用先の投稿の投稿者名と本文を枠で囲んで表示する", async ({
  page,
}) => {
  const text = `post-form-9: ${Date.now()}`;
  const dialog = await openComposeFrom(page, text, "引用");

  await expect(dialog.getByRole("blockquote")).toContainText(text);
});

test("post-form-11: 返信するときは、返信できる人の設定を表示しない", async ({
  page,
}) => {
  const dialog = await openComposeFrom(
    page,
    `post-form-11: ${Date.now()}`,
    "返信",
  );

  await expect(
    dialog.getByRole("button", { name: "返信", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "誰でも返信できます" }),
  ).not.toBeVisible();
});
