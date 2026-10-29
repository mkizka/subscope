import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord } from "./pds";

test.describe("通知", () => {
  test("notification-3: 自分の投稿にリプライ・引用・メンションされると、その投稿が通知に出る", async ({
    page,
    request,
  }) => {
    const createdAt = new Date().toISOString();
    const post = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "notification-3: 元の投稿",
      createdAt,
    });
    const aliceDid = new URL(post.uri).hostname;
    const { did: bobDid } = await (
      await request.get(
        "http://localhost:2583/xrpc/com.atproto.identity.resolveHandle?handle=bob.test",
      )
    ).json();
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: bobDid,
      createdAt,
    });
    const ref = { uri: post.uri, cid: post.cid };
    const mentionText = "notification-3: メンション @alice.test";
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
    const mention = "@alice.test";
    const byteStart = Buffer.byteLength(mentionText) - mention.length;
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: mentionText,
      facets: [
        {
          index: { byteStart, byteEnd: byteStart + mention.length },
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
});
