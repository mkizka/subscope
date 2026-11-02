import { expect, test } from "@playwright/test";

import { createRecord, uploadBlob, uploadImage } from "../../helpers/pds";

test.describe("投稿画像", () => {
  test("post-images-1: 画像が1枚のときは、投稿の幅いっぱいに表示する", async ({
    page,
  }) => {
    const text = `post-images-1: ${Date.now()}`;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      embed: {
        $type: "app.bsky.embed.images",
        images: [{ image: await uploadImage("alice.test"), alt: text }],
      },
      createdAt: new Date().toISOString(),
    });
    const post = page.getByRole("article").filter({ hasText: text });
    await page.goto("/");
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();

    const image = await post.getByRole("img", { name: text }).boundingBox();
    const body = await post
      .locator("p")
      .filter({ hasText: text })
      .boundingBox();
    expect(image?.width).toBe(body?.width);
  });

  test("post-images-2: gallery埋め込み(app.bsky.embed.gallery)の画像も、すべて並べて表示する", async ({
    page,
  }) => {
    const text = `post-images-2: ${Date.now()}`;
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
