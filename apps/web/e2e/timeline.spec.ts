import { type APIRequestContext, expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

const createSession = async (request: APIRequestContext) => {
  const session = await request.post(
    `${PDS_URL}/xrpc/com.atproto.server.createSession`,
    { data: { identifier: "alice.test", password: "password" } },
  );
  const { did, accessJwt } = await session.json();
  return async (collection: string, record: Record<string, unknown>) => {
    const response = await request.post(
      `${PDS_URL}/xrpc/com.atproto.repo.createRecord`,
      {
        headers: { Authorization: `Bearer ${accessJwt}` },
        data: {
          repo: did,
          collection,
          record: { ...record, createdAt: new Date().toISOString() },
        },
      },
    );
    const { uri, cid } = await response.json();
    return { uri, cid };
  };
};

test.describe("タイムライン", () => {
  test("timeline-1: 自分とフォロー中のユーザーの投稿を、新しい投稿ほど下に並べて表示する", async ({
    page,
    request,
  }) => {
    const createRecord = await createSession(request);
    const texts = ["timeline-1: 古い投稿", "timeline-1: 新しい投稿"];
    for (const text of texts) {
      await createRecord("app.bsky.feed.post", { text });
    }

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("timeline-2: いいね数・リポスト数は1以上のときだけ投稿に表示する", async ({
    page,
    request,
  }) => {
    const createRecord = await createSession(request);
    const subject = await createRecord("app.bsky.feed.post", {
      text: "timeline-2: 反応あり",
    });
    await createRecord("app.bsky.feed.like", { subject });
    await createRecord("app.bsky.feed.repost", { subject });
    await createRecord("app.bsky.feed.post", { text: "timeline-2: 反応なし" });

    await login(page);

    const reacted = page
      .getByRole("article")
      .filter({ hasText: "timeline-2: 反応あり" })
      .last();
    await expect(async () => {
      await page.reload();
      await expect(reacted).toContainText("1件のいいね", { timeout: 1000 });
      await expect(reacted).toContainText("1件のリポスト", { timeout: 1000 });
    }).toPass();
    const notReacted = page
      .getByRole("article")
      .filter({ hasText: "timeline-2: 反応なし" });
    await expect(notReacted).not.toContainText("いいね");
    await expect(notReacted).not.toContainText("リポスト");
  });

  test("timeline-3: リプライはタイムラインに出さず、親投稿に返信の件数を表示する", async ({
    page,
    request,
  }) => {
    const createRecord = await createSession(request);
    const parent = await createRecord("app.bsky.feed.post", {
      text: "timeline-3: 親投稿",
    });
    await createRecord("app.bsky.feed.post", {
      text: "timeline-3: 返信",
      reply: { root: parent, parent },
    });

    await login(page);

    const parentPost = page
      .getByRole("article")
      .filter({ hasText: "timeline-3: 親投稿" });
    await expect(async () => {
      await page.reload();
      await expect(parentPost).toContainText("1件の返信", { timeout: 1000 });
    }).toPass();
    await expect(page.getByText("timeline-3: 返信")).toHaveCount(0);
  });
});
