import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord, follow, putRecord, resolveHandle } from "./pds";

test.describe("通知", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("notification-6: モバイルでは、未読があるときヘッダーの🔔に未読数が出る", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await follow("bob.test", "alice.test");

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByLabel("通知を開く")).toHaveText(/^\d+$/, {
        timeout: 1000,
      });
    }).toPass();
  });
});

test.describe("通知（PC）", () => {
  test("notification-3: 自分の投稿にリプライ・引用・メンションされると、その投稿が通知に出る", async ({
    page,
  }) => {
    const createdAt = new Date().toISOString();
    const aliceDid = await resolveHandle("alice.test");
    const post = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "notification-3: 元の投稿",
      createdAt,
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    const ref = { uri: post.uri, cid: post.cid };
    const mention = "@alice.test";
    const mentionText = `notification-3: メンション ${mention}`;
    const texts = [
      "notification-3: リプライ",
      "notification-3: 引用",
      mentionText,
    ];
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: texts[0],
      reply: { root: ref, parent: ref },
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: texts[1],
      embed: { $type: "app.bsky.embed.record", record: ref },
      createdAt,
    });
    const byteEnd = Buffer.byteLength(mentionText);
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: mentionText,
      facets: [
        {
          index: { byteStart: byteEnd - mention.length, byteEnd },
          features: [
            { $type: "app.bsky.richtext.facet#mention", did: aliceDid },
          ],
        },
      ],
      createdAt,
    });

    await login(page);

    const panel = page.getByRole("complementary");
    await expect(async () => {
      await page.reload();
      for (const text of texts) {
        await expect(panel.getByText(text)).toBeVisible({ timeout: 1000 });
      }
    }).toPass();
  });

  test("notification-4: 通知は新しい順に並び、下までスクロールすると古い通知を読み込む", async ({
    page,
  }) => {
    const post = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "notification-4: 元の投稿",
      createdAt: new Date().toISOString(),
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    const ref = { uri: post.uri, cid: post.cid };
    const texts = Array.from(
      { length: 31 },
      (_, i) => `notification-4: リプライ${i}`,
    );
    for (const text of texts) {
      await createRecord("bob.test", "app.bsky.feed.post", {
        text,
        reply: { root: ref, parent: ref },
        createdAt: new Date().toISOString(),
      });
    }

    await login(page);

    const replies = page
      .getByRole("complementary")
      .getByText(/^notification-4: リプライ/);
    await expect(async () => {
      await page.reload();
      await expect(replies.first()).toBeVisible({ timeout: 1000 });
      await replies.last().scrollIntoViewIfNeeded();
      await expect(replies).toHaveText([...texts].reverse(), { timeout: 1000 });
    }).toPass();
  });
});
