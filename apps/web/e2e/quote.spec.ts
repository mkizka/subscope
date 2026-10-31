import { expect, test } from "@playwright/test";

import { createRecord, uploadImage } from "./pds";

test.describe("引用投稿", () => {
  test("quote-1: 引用している投稿の投稿者名と本文を、引用した投稿の中に表示する", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-1: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-1: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const quote = page
      .getByRole("article")
      .filter({ hasText: "quote-1: 引用した投稿" })
      .getByRole("blockquote");
    await expect(async () => {
      await page.reload();
      await expect(quote).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(quote).toContainText("@alice.test");
    await expect(quote).toContainText("quote-1: 引用される投稿");
  });

  test("quote-2: 画像付きで引用した投稿は、画像と引用している投稿の両方を表示する", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-2: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-2: 引用した投稿",
      embed: {
        $type: "app.bsky.embed.recordWithMedia",
        record: { $type: "app.bsky.embed.record", record: quoted },
        media: {
          $type: "app.bsky.embed.images",
          images: [
            { image: await uploadImage("alice.test"), alt: "quote-2: 画像" },
          ],
        },
      },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const post = page
      .getByRole("article")
      .filter({ hasText: "quote-2: 引用した投稿" });
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(
      post.getByRole("img", { name: "quote-2: 画像" }),
    ).toBeVisible();
    await expect(post.getByRole("blockquote")).toContainText(
      "quote-2: 引用される投稿",
    );
  });
});
