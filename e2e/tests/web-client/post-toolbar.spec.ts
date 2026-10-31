import { expect, test } from "@playwright/test";

import { createRecord, follow, PDS_URL } from "../../helpers/pds";

const cases = [
  { id: "post-toolbar-1", name: "いいね", collection: "app.bsky.feed.like" },
  {
    id: "post-toolbar-2",
    name: "リポスト",
    collection: "app.bsky.feed.repost",
  },
];

for (const { id, name, collection } of cases) {
  test(`${id}: ${name}ボタンで投稿に${name}し、もう一度押すと取り消す`, async ({
    page,
    request,
  }) => {
    const session = await request.post(
      `${PDS_URL}/xrpc/com.atproto.server.createSession`,
      { data: { identifier: "alice.test", password: "password" } },
    );
    const { did, accessJwt } = await session.json();
    const createRecord = (collection: string, record: object, rkey?: string) =>
      request.post(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
        headers: { Authorization: `Bearer ${accessJwt}` },
        data: { repo: did, collection, rkey, record },
      });
    await createRecord(
      "app.bsky.actor.profile",
      { displayName: "Alice" },
      "self",
    );
    const text = `${id}: 投稿`;
    const created = await createRecord("app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    const { uri }: { uri: string } = await created.json();
    const hasRecord = async () => {
      const res = await request.get(
        `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=${collection}`,
      );
      return (await res.text()).includes(uri);
    };

    await page.goto("/");
    const post = page
      .getByRole("article")
      .filter({ hasText: text })
      .filter({ hasNotText: "がリポスト" });
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();
    const button = post.getByRole("button", { name });

    const reacted = page.waitForResponse((res) =>
      res.url().includes("/api/reactions"),
    );
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await reacted;
    await expect.poll(hasRecord).toBe(true);

    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect.poll(hasRecord).toBe(false);
  });
}

type PostRecord = {
  text: string;
  reply?: { parent: { uri: string } };
  embed?: { record?: { uri: string } };
};

const composeCases = [
  {
    id: "post-toolbar-3",
    name: "返信",
    title: "返信ボタンで投稿欄が開き、投稿するとその投稿への返信になる",
    subjectOf: (record: PostRecord) => record.reply?.parent.uri,
  },
  {
    id: "post-toolbar-4",
    name: "引用",
    title: "引用ボタンで投稿欄が開き、投稿するとその投稿を引用した投稿になる",
    subjectOf: (record: PostRecord) => record.embed?.record?.uri,
  },
];

for (const { id, name, title, subjectOf } of composeCases) {
  test(`${id}: ${title}`, async ({ page, request }) => {
    const text = `${id}: 投稿`;
    const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const post = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();
    await post.getByRole("button", { name }).click();
    await page
      .getByRole("textbox", { name: "投稿内容" })
      .fill(`${id}: ${name}`);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect
      .poll(async () => {
        const res = await request.get(
          `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=alice.test&collection=app.bsky.feed.post`,
        );
        const { records }: { records: { value: PostRecord }[] } =
          await res.json();
        return records
          .filter((r) => r.value.text === `${id}: ${name}`)
          .map((r) => subjectOf(r.value));
      })
      .toContain(uri);
  });
}

test("post-toolbar-5: いいね・リポストのボタンは、押した結果を画面に反映し終えるまで押せない", async ({
  page,
  request,
}) => {
  const text = "post-toolbar-5: 投稿";
  const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });

  await page.goto("/");
  const post = page
    .getByRole("article")
    .filter({ hasText: text })
    .filter({ hasNotText: "がリポスト" });
  await expect(async () => {
    await page.reload();
    await expect(post).toBeVisible({ timeout: 1000 });
  }).toPass();

  for (const [name, collection] of [
    ["いいね", "app.bsky.feed.like"],
    ["リポスト", "app.bsky.feed.repost"],
  ]) {
    const button = post.getByRole("button", { name });
    await button.click();
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const res = await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=alice.test&collection=${collection}`,
    );
    const { records }: { records: { value: { subject: { uri: string } } }[] } =
      await res.json();
    expect(records.filter((r) => r.value.subject.uri === uri)).toHaveLength(1);
  }
});

test("post-toolbar-6: 削除ボタンは自分の投稿にだけ表示する", async ({
  page,
}) => {
  await follow("alice.test", "bob.test");
  const createdAt = new Date().toISOString();
  await createRecord("alice.test", "app.bsky.feed.post", {
    text: "post-toolbar-6: 自分の投稿",
    createdAt,
  });
  await createRecord("bob.test", "app.bsky.feed.post", {
    text: "post-toolbar-6: 他人の投稿",
    createdAt,
  });

  await page.goto("/");
  const mine = page
    .getByRole("article")
    .filter({ hasText: "post-toolbar-6: 自分の投稿" });
  const others = page
    .getByRole("article")
    .filter({ hasText: "post-toolbar-6: 他人の投稿" });
  await expect(async () => {
    await page.reload();
    await expect(mine).toBeVisible({ timeout: 1000 });
    await expect(others).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(mine.getByRole("button", { name: "削除" })).toBeVisible();
  await expect(others.getByRole("button", { name: "削除" })).toHaveCount(0);
});

test("post-toolbar-7: 削除ボタンで確認ダイアログを開き、削除すると再読み込みなしでタイムラインから投稿を消す", async ({
  page,
  request,
}) => {
  const text = "post-toolbar-7: 投稿";
  const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });

  await page.goto("/");
  const post = page.getByRole("article").filter({ hasText: text });
  await expect(async () => {
    await page.reload();
    await expect(post).toBeVisible({ timeout: 1000 });
  }).toPass();
  await post.getByRole("button", { name: "削除" }).click();
  await page
    .getByRole("dialog", { name: "投稿を削除" })
    .getByRole("button", { name: "削除" })
    .click();

  await expect(post).toHaveCount(0);
  const res = await request.get(
    `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=alice.test&collection=app.bsky.feed.post`,
  );
  expect(await res.text()).not.toContain(uri);
});
