import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord } from "./pds";

test.describe("通知", () => {
  test("notification-4: 通知は新しい順に並び、下までスクロールすると古い通知を読み込む", async ({
    page,
  }) => {
    const bob = await createRecord("bob.test", "app.bsky.feed.post", {
      text: "notification-4: bobの投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: new URL(bob.uri).hostname,
      createdAt: new Date().toISOString(),
    });
    const alice = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "notification-4: aliceの投稿",
      createdAt: new Date().toISOString(),
    });
    const reply = { root: alice, parent: alice };
    for (let i = 0; i < 31; i++) {
      await createRecord("bob.test", "app.bsky.feed.post", {
        text: `notification-4: リプライ${i}`,
        reply,
        createdAt: new Date().toISOString(),
      });
    }

    await login(page);
    const items = page
      .getByRole("region", { name: "通知" })
      .getByRole("listitem");

    await expect(async () => {
      await page.reload();
      await expect(items).not.toHaveCount(0, { timeout: 1000 });
      const count = await items.count();
      await items.last().scrollIntoViewIfNeeded();
      await expect(items).not.toHaveCount(count, { timeout: 1000 });
    }).toPass();
  });
});
