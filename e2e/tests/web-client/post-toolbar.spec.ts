import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

import { createRecord, PDS_URL } from "../../helpers/pds";

const toggleReaction = async (
  { page, request }: { page: Page; request: APIRequestContext },
  { id, name, collection }: { id: string; name: string; collection: string },
) => {
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
};

test("postToolbar-e1: いいねボタンで投稿にいいねし、もう一度押すと取り消す", ({
  page,
  request,
}) =>
  toggleReaction(
    { page, request },
    {
      id: "postToolbar-e1",
      name: "いいね",
      collection: "app.bsky.feed.like",
    },
  ));

test("postToolbar-e2: リポストボタンで投稿をリポストし、もう一度押すと取り消す", ({
  page,
  request,
}) =>
  toggleReaction(
    { page, request },
    {
      id: "postToolbar-e2",
      name: "リポスト",
      collection: "app.bsky.feed.repost",
    },
  ));

type PostRecord = {
  text: string;
  reply?: { parent: { uri: string } };
  embed?: { record?: { uri: string } };
};

const composeAndSubmit = async (
  { page, request }: { page: Page; request: APIRequestContext },
  {
    id,
    name,
    submit,
    subjectOf,
  }: {
    id: string;
    name: string;
    submit: string;
    subjectOf: (record: PostRecord) => string | undefined;
  },
) => {
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
  await page.getByRole("textbox", { name: "投稿内容" }).fill(`${id}: ${name}`);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: submit, exact: true })
    .click();

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
};

test("postToolbar-e3: 返信ボタンで投稿欄が開き、投稿するとその投稿への返信になる", ({
  page,
  request,
}) =>
  composeAndSubmit(
    { page, request },
    {
      id: "postToolbar-e3",
      name: "返信",
      submit: "返信",
      subjectOf: (record) => record.reply?.parent.uri,
    },
  ));

test("postToolbar-e4: 引用ボタンで投稿欄が開き、投稿するとその投稿を引用した投稿になる", ({
  page,
  request,
}) =>
  composeAndSubmit(
    { page, request },
    {
      id: "postToolbar-e4",
      name: "引用",
      submit: "投稿",
      subjectOf: (record) => record.embed?.record?.uri,
    },
  ));

test("postToolbar-e5: いいね・リポストのボタンは押した結果を画面に反映し終えるまで押せない", async ({
  page,
  request,
}) => {
  const text = "postToolbar-e5: 投稿";
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
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) => url.pathname.startsWith("/api/reactions"),
      async (route) => {
        await held;
        await route.continue();
      },
      { times: 1 },
    );
    await button.click();
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    release();
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

test("postToolbar-e6: 削除ボタンで確認ダイアログを開き、削除すると再読み込みなしでタイムラインから投稿を消す", async ({
  page,
  request,
}) => {
  const text = "postToolbar-e6: 投稿";
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
  await post.getByRole("button", { name: "投稿のメニュー" }).click();
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

test("postToolbar-e7: 返信を投稿すると、再読み込みなしで返信先の投稿の返信の件数を増やす", async ({
  page,
}) => {
  const text = "postToolbar-e7: 投稿";
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
  await post.getByRole("button", { name: "返信" }).click();
  await page
    .getByRole("textbox", { name: "投稿内容" })
    .fill("postToolbar-e7: 返信");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返信", exact: true })
    .click();

  await expect(post.getByTitle("1件の返信")).toHaveText("1");
});

test("postToolbar-e8: 投稿のメニューの「リンクをコピー」で、投稿のスレッドのURLをクリップボードにコピーする", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const text = "postToolbar-e8: 投稿";
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
  await post.getByRole("button", { name: "投稿のメニュー" }).click();
  await post.getByRole("button", { name: "リンクをコピー" }).click();

  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `${new URL(page.url()).origin}/alice.test/post/${uri.split("/").pop()}`,
  );
});

const getProfileRecord = async (request: APIRequestContext, handle: string) =>
  (
    await request.get(
      `${PDS_URL}/xrpc/com.atproto.repo.getRecord?repo=${handle}&collection=app.bsky.actor.profile&rkey=self`,
    )
  ).text();

const openPostMenu = async (page: Page, text: string) => {
  await page.goto("/");
  const post = page.getByRole("article").filter({ hasText: text });
  await expect(async () => {
    await page.reload();
    await expect(post).toBeVisible({ timeout: 1000 });
  }).toPass();
  await post.getByRole("button", { name: "投稿のメニュー" }).click();
  return post;
};

test("postToolbar-e9: 自分の投稿の「…」メニューの「プロフィールにピン留め」で、確認なしにプロフィールのピン留めをその投稿にし、ピン留め中の投稿では「ピン留めを外す」でピン留めを外す", async ({
  page,
  request,
}) => {
  const text = "postToolbar-e9: 投稿";
  const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });

  const post = await openPostMenu(page, text);
  await post.getByRole("button", { name: "プロフィールにピン留め" }).click();
  await expect
    .poll(() => getProfileRecord(request, "alice.test"))
    .toContain(uri);

  await post.getByRole("button", { name: "投稿のメニュー" }).click();
  await post.getByRole("button", { name: "ピン留めを外す" }).click();
  await expect
    .poll(() => getProfileRecord(request, "alice.test"))
    .not.toContain("pinnedPost");
});

test("postToolbar-e10: 別の投稿がピン留め中のときに「プロフィールにピン留め」を押すと、確認なしにピン留めをその投稿へ入れ替える", async ({
  page,
  request,
}) => {
  const text = "postToolbar-e10: 投稿";
  const first = await createRecord("alice.test", "app.bsky.feed.post", {
    text: "postToolbar-e10: 先にピン留めする投稿",
    createdAt: new Date().toISOString(),
  });
  const second = await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });

  const firstPost = await openPostMenu(
    page,
    "postToolbar-e10: 先にピン留めする投稿",
  );
  await firstPost
    .getByRole("button", { name: "プロフィールにピン留め" })
    .click();
  await expect
    .poll(() => getProfileRecord(request, "alice.test"))
    .toContain(first.uri);

  const post = await openPostMenu(page, text);
  await post.getByRole("button", { name: "プロフィールにピン留め" }).click();
  await expect
    .poll(() => getProfileRecord(request, "alice.test"))
    .toContain(second.uri);
});
