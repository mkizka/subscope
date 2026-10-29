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
  test("notification-2: フォローされると、相手の名前が通知に出る", async ({
    page,
  }) => {
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await follow("bob.test", "alice.test");

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(
        page
          .getByRole("complementary")
          .getByText("Bobさんにフォローされました")
          .first(),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("notification-1: 自分の投稿がいいね・リポストされると、相手の名前と対象の投稿の本文が通知に出る", async ({
    page,
  }) => {
    const createdAt = new Date().toISOString();
    const text = `notification-1: ${createdAt}`;
    const post = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt,
    });
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    const subject = { uri: post.uri, cid: post.cid };
    await createRecord("bob.test", "app.bsky.feed.like", {
      subject,
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.feed.repost", {
      subject,
      createdAt,
    });

    await login(page);

    const panel = page.getByRole("complementary");
    await expect(async () => {
      await page.reload();
      for (const label of [
        "Bobさんがいいねしました",
        "Bobさんがリポストしました",
      ]) {
        await expect(
          panel
            .getByRole("listitem")
            .filter({ hasText: label })
            .filter({ hasText: text }),
        ).toBeVisible({ timeout: 1000 });
      }
    }).toPass();
  });

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

  test("notification-5: 未読の通知は背景色で区別され、通知を開いた後に再表示すると既読になる", async ({
    page,
  }) => {
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: await resolveHandle("alice.test"),
      createdAt: new Date().toISOString(),
    });

    await login(page);

    const notification = page
      .getByRole("region", { name: "通知" })
      .getByRole("listitem")
      .first();
    await expect(async () => {
      await page.reload();
      await expect(notification).toHaveText("Bob", { timeout: 1000 });
      await expect(notification).toHaveClass(/bg-base-200/, { timeout: 1000 });
    }).toPass();

    await expect(async () => {
      await page.reload();
      await expect(notification).not.toHaveClass(/bg-base-200/, {
        timeout: 1000,
      });
    }).toPass();
  });
});
