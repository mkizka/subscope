import { expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

test.describe("タイムライン", () => {
  test("timeline-1: 自分とフォロー中のユーザーの投稿を、新しい投稿ほど下に並べて表示する", async ({
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
    const texts = ["timeline-1: 古い投稿", "timeline-1: 新しい投稿"];
    for (const text of texts) {
      await createRecord("app.bsky.feed.post", {
        text,
        createdAt: new Date().toISOString(),
      });
    }

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });
});
