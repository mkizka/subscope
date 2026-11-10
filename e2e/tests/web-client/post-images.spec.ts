import { expect, test } from "@playwright/test";

import { createRecord, uploadBlob } from "../../helpers/pds";

test.describe("投稿画像", () => {
  test("post-images-e1: gallery埋め込み(app.bsky.embed.gallery)の画像も、すべて並べて表示する", async ({
    page,
  }) => {
    const text = `post-images-e1: ${Date.now()}`;
    const items = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => ({
        $type: "app.bsky.embed.gallery#image",
        image: await uploadBlob("alice.test", new Uint8Array([i])),
        alt: text,
        aspectRatio: { width: 1, height: 1 },
      })),
    );
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      embed: { $type: "app.bsky.embed.gallery", items },
      createdAt: new Date().toISOString(),
    });
    const post = page.getByRole("article").filter({ hasText: text });
    await page.goto("/");
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();

    await expect(post.getByRole("img", { name: text })).toHaveCount(6);
  });
});
