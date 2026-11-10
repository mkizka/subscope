import { expect, type Page, test } from "@playwright/test";

import { createRecord, uploadImage } from "../../helpers/pds";

const openViewer = async (page: Page, text: string, alt: string) => {
  await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    embed: {
      $type: "app.bsky.embed.images",
      images: [{ image: await uploadImage("alice.test"), alt }],
    },
    createdAt: new Date().toISOString(),
  });
  const post = page.getByRole("article").filter({ hasText: text });
  const viewer = page.getByRole("dialog", { name: "画像の拡大表示" });
  await page.goto("/");
  await expect(async () => {
    await page.reload();
    await post.getByRole("button", { name: alt }).click({ timeout: 1000 });
    await expect(viewer).toBeVisible({ timeout: 1000 });
  }).toPass();
  return viewer;
};

test.describe("画像の拡大表示", () => {
  test("image-viewer-e1: ブラウザの戻るで閉じ、元の画面にとどまる", async ({
    page,
  }) => {
    const viewer = await openViewer(
      page,
      "image-viewer-e1: 投稿",
      "image-viewer-e1: 画像",
    );

    await page.goBack();
    await expect(viewer).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });
});
