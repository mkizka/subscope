import { expect, type Page, test } from "@playwright/test";

import { PDS_URL, resolveHandle } from "../../helpers/pds";

const image = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
});

const wideImage = {
  name: "wide.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAC0lEQVR4nGNgwAQAABQAAX3+Hu4AAAAASUVORK5CYII=",
    "base64",
  ),
};

const writeAlt = async (page: Page, n: number, alt: string) => {
  await page.getByRole("button", { name: `画像${n}のALTを編集` }).click();
  const dialog = page.getByRole("dialog", { name: "ALTを追加" });
  await dialog.getByRole("textbox", { name: "ALT" }).fill(alt);
  await dialog.getByRole("button", { name: "完了" }).click();
};

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

  test("post-form-e1: 新規投稿ボタンで投稿欄を開き、投稿すると投稿欄を閉じて、投稿した内容を再読み込みなしでタイムラインの一番上に表示する", async ({
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
    const text = `post-form-e1: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(
      page.getByRole("textbox", { name: "投稿内容" }),
    ).not.toBeVisible();
    await expect(page.getByText(/^post-form-e1: /).first()).toHaveText(text);
  });

  test("post-form-e2: 画像にALTを付けて添付でき、タイムラインの投稿にALT付きで表示する", async ({
    page,
  }) => {
    const alt = `post-form-e2: ${Date.now()}`;
    await page.getByLabel("画像を追加").setInputFiles(image("a.png"));
    await writeAlt(page, 1, alt);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(page.getByRole("img", { name: alt })).toBeAttached();
  });

  test("post-form-e3: 返信できる人の設定は、投稿と同じrkeyのthreadgateに保存する", async ({
    page,
    request,
  }) => {
    const text = `post-form-e3: ${Date.now()}`;
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

  test("post-form-e5: 添付した画像には、公式クライアントと同じく実寸の縦横比をaspectRatioに保存する", async ({
    page,
    request,
  }) => {
    const text = `post-form-e5: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByLabel("画像を追加").setInputFiles(wideImage);
    await page.getByRole("button", { name: "投稿", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "投稿内容" }),
    ).not.toBeVisible();

    const did = await resolveHandle("alice.test");
    const res = await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords`,
      {
        params: { repo: did, collection: "app.bsky.feed.post", limit: 1 },
      },
    );
    const {
      records: [record],
    }: {
      records: [
        {
          value: {
            text: string;
            embed: { images: { aspectRatio: unknown }[] };
          };
        },
      ];
    } = await res.json();
    expect(record.value.text).toBe(text);
    expect(record.value.embed.images[0]?.aspectRatio).toEqual({
      width: 3,
      height: 2,
    });
  });

  test("post-form-e4: 本文のURLとハッシュタグには、その範囲にfacetsを付ける", async ({
    page,
    request,
  }) => {
    const text = `post-form-e4: ${Date.now()} 日本語 example.com/post-form-6 #subscope`;
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
});
