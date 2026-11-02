import { expect, test } from "@playwright/test";

import { createRecord, uploadImage } from "../../helpers/pds";

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
});
