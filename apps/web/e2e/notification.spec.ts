import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord } from "./pds";

test.describe("通知", () => {
  test("notification-1: 自分の投稿がいいね・リポストされると、相手の名前と対象の投稿の本文が通知に出る", async ({
    page,
    request,
  }) => {
    const resolved = await request.get(
      "http://localhost:2583/xrpc/com.atproto.identity.resolveHandle?handle=bob.test",
    );
    const { did: bobDid } = await resolved.json();
    const createdAt = new Date().toISOString();
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: bobDid,
      createdAt,
    });
    await createRecord(
      "bob.test",
      "app.bsky.actor.profile",
      { displayName: "Bob" },
      "self",
    );
    const text = `notification-1: ${createdAt}`;
    const subject = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.feed.like", {
      subject,
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.feed.repost", {
      subject,
      createdAt,
    });

    await login(page);

    const items = page.getByRole("listitem").filter({ hasText: text });
    await expect(async () => {
      await page.reload();
      await expect(items.filter({ hasText: "いいね" })).toContainText("Bob", {
        timeout: 1000,
      });
      await expect(items.filter({ hasText: "リポスト" })).toContainText("Bob", {
        timeout: 1000,
      });
    }).toPass();
  });
});
