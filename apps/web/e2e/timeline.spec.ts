import { type APIRequestContext, expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

const createPosts = async (request: APIRequestContext, texts: string[]) => {
  const session = await request.post(
    `${PDS_URL}/xrpc/com.atproto.server.createSession`,
    { data: { identifier: "alice.test", password: "password" } },
  );
  const { did, accessJwt } = await session.json();
  for (const text of texts) {
    await request.post(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
      headers: { Authorization: `Bearer ${accessJwt}` },
      data: {
        repo: did,
        collection: "app.bsky.feed.post",
        record: { text, createdAt: new Date().toISOString() },
      },
    });
  }
};

test.describe("タイムライン", () => {
  test("timeline-1: 自分とフォロー中のユーザーの投稿を、新しい投稿ほど下に並べて表示する", async ({
    page,
    request,
  }) => {
    const texts = ["timeline-1: 古い投稿", "timeline-1: 新しい投稿"];
    await createPosts(request, texts);

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("timeline-2: 開くと最新の投稿までスクロールし、上にスクロールすると古い投稿を読み込む", async ({
    page,
    request,
  }) => {
    const texts = Array.from(
      { length: 25 },
      (_, i) => `timeline-2: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByText("timeline-2: 投稿25")).toBeInViewport({
        timeout: 1000,
      });
    }).toPass();
    await expect(
      page.getByText("timeline-2: 投稿1", { exact: true }),
    ).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(
      page.getByText("timeline-2: 投稿1", { exact: true }),
    ).toBeVisible();
  });
});
