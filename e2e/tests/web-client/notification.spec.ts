import { expect, test } from "@playwright/test";

import {
  createRecord,
  follow,
  putRecord,
  resolveHandle,
  uploadBlob,
} from "../../helpers/pds";

test.describe("通知", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("notification-6: モバイルでは、未読があるときヘッダーの🔔に未読数を表示する", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await follow("bob.test", "alice.test");

    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(page.getByLabel("通知を開く")).toHaveText(/^\d+$/, {
        timeout: 1000,
      });
    }).toPass();
  });
});

test.describe("通知（PC）", () => {
  test("notification-2: フォローの通知には、相手の名前を表示する", async ({
    page,
  }) => {
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    await follow("bob.test", "alice.test");

    await page.goto("/notifications");

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

  test("notification-1: いいね・リポストの通知には、相手の名前と対象の投稿の本文を表示する", async ({
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

    await page.goto("/notifications");

    const panel = page.getByRole("region", { name: "通知" });
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

  test("notification-3: リプライ・引用・メンションの通知には、相手の名前とその投稿を表示する", async ({
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

    await page.goto("/notifications");

    const panel = page.getByRole("region", { name: "通知" });
    await expect(async () => {
      await page.reload();
      for (const [label, text] of [
        ["Bobさんが返信しました", texts[0]],
        ["Bobさんが引用しました", texts[1]],
        ["Bobさんがメンションしました", texts[2]],
      ] as const) {
        await expect(
          panel
            .getByRole("listitem")
            .filter({ hasText: label })
            .filter({ hasText: text }),
        ).toBeVisible({ timeout: 1000 });
      }
    }).toPass();
  });

  test("notification-5: 未読の通知は背景色で区別し、通知を開いた後に再表示すると既読にする", async ({
    page,
  }) => {
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await follow("alice.test", "bob.test");
    const { uri } = await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: await resolveHandle("alice.test"),
      createdAt: new Date().toISOString(),
    });
    await expect
      .poll(async () => {
        const res = await page.request.get("/api/notifications");
        const { notifications }: { notifications: { uri: string }[] } =
          await res.json();
        return notifications[0]?.uri;
      })
      .toBe(uri);

    await page.goto("/notifications");

    const notification = page
      .getByRole("region", { name: "通知" })
      .getByRole("listitem")
      .first();
    await expect(notification).toHaveText("Bobさんにフォローされました");
    await expect(notification).toHaveClass(/bg-base-200/);

    await expect(async () => {
      await page.reload();
      await expect(notification).not.toHaveClass(/bg-base-200/, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("notification-4: 通知を新しい順に並べ、下までスクロールすると古い通知を読み込む", async ({
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

    await page.goto("/notifications");

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

  test("notification-7: 通知には、種類を表す色付きのアイコンと相手のアバターを表示する", async ({
    page,
  }) => {
    const avatar = await uploadBlob(
      "bob.test",
      Uint8Array.from(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        ),
      ),
    );
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
      avatar,
    });
    await follow("alice.test", "bob.test");
    await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: await resolveHandle("alice.test"),
      createdAt: new Date().toISOString(),
    });

    await page.goto("/notifications");

    const notification = page
      .getByRole("complementary")
      .getByRole("listitem")
      .filter({ hasText: "Bobさんにフォローされました" })
      .first();
    await expect(async () => {
      await page.reload();
      await expect(
        notification.getByRole("img", { name: "フォロー" }),
      ).toBeVisible({ timeout: 1000 });
      await expect(
        notification.locator(`img[src*="${avatar.ref.$link}"]`),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
  });
});
