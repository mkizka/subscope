import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord } from "./pds";

test.describe("通知", () => {
  test("notification-4: 通知は新しい順に並び、下までスクロールすると古い通知を読み込む", async ({
    page,
  }) => {
    const now = () => new Date().toISOString();
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "notification-4: リプライ先",
      createdAt: now(),
    });
    const bobPost = await createRecord("bob.test", "app.bsky.feed.post", {
      text: "notification-4: bobの投稿",
      createdAt: now(),
    });
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: bobPost.uri.split("/")[2],
      createdAt: now(),
    });
    const ref = { uri: parent.uri, cid: parent.cid };
    for (let i = 0; i < 31; i++) {
      await createRecord("bob.test", "app.bsky.feed.post", {
        text: `notification-4: リプライ${i}`,
        reply: { root: ref, parent: ref },
        createdAt: now(),
      });
    }

    await login(page);

    const items = page
      .getByRole("region", { name: "通知" })
      .getByRole("listitem");
    await expect(async () => {
      await page.reload();
      await expect(items).toHaveCount(30, { timeout: 1000 });
      await items.last().scrollIntoViewIfNeeded();
      await expect(items.nth(30)).toBeAttached({ timeout: 1000 });
    }).toPass();
  });
});
