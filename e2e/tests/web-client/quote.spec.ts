import { expect, test } from "@playwright/test";

import { createRecord, putRecord, uploadImage } from "../../helpers/pds";

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

  test("quote-3: 引用される投稿に付いた画像を、引用した投稿の中に表示する", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-3: 引用される投稿",
      embed: {
        $type: "app.bsky.embed.images",
        images: [
          { image: await uploadImage("alice.test"), alt: "quote-3: 画像" },
        ],
      },
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-3: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const quote = page
      .getByRole("article")
      .filter({ hasText: "quote-3: 引用した投稿" })
      .getByRole("blockquote");
    await expect(async () => {
      await page.reload();
      await expect(quote).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(
      quote.getByRole("img", { name: "quote-3: 画像" }),
    ).toBeVisible();
  });

  test("quote-4: 引用されている投稿の投稿者のアバターを、引用した投稿の中に表示する", async ({
    page,
  }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      avatar: await uploadImage("alice.test"),
    });
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-4: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-4: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const quote = page
      .getByRole("article")
      .filter({ hasText: "quote-4: 引用した投稿" })
      .getByRole("blockquote");
    await expect(async () => {
      await page.reload();
      await expect(quote.locator('img[src*="/img/avatar"]')).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test("quote-5: 引用されている投稿をタップすると、その投稿のスレッドを開く", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-5: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-5: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const link = page
      .getByRole("article")
      .filter({ hasText: "quote-5: 引用した投稿" })
      .getByRole("link", { name: "引用された投稿のスレッドを開く" });
    await expect(async () => {
      await page.reload();
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();

    await expect(page).toHaveURL(
      `/alice.test/post/${quoted.uri.split("/").pop()}`,
    );
    await expect(page.getByLabel("選んだ投稿")).toContainText(
      "quote-5: 引用される投稿",
    );
  });
});
