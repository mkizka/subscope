import { expect, type Page, test } from "@playwright/test";

import { createRecord, uploadImage } from "../../helpers/pds";

const openViewer = async (page: Page, text: string, alts: string[]) => {
  await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    embed: {
      $type: "app.bsky.embed.images",
      images: await Promise.all(
        alts.map(async (alt) => ({
          image: await uploadImage("alice.test"),
          alt,
        })),
      ),
    },
    createdAt: new Date().toISOString(),
  });
  const post = page.getByRole("article").filter({ hasText: text });
  const viewer = page.getByRole("dialog", { name: "画像の拡大表示" });
  await page.goto("/");
  await expect(async () => {
    await page.reload();
    await post.getByRole("button", { name: alts[0] }).click({ timeout: 1000 });
    await expect(viewer).toBeVisible({ timeout: 1000 });
  }).toPass();
  return viewer;
};

test.describe("画像の拡大表示", () => {
  test("image-viewer-1: 投稿画像を選ぶと、スレッドは開かずに元サイズの画像を拡大して表示する", async ({
    page,
  }) => {
    const viewer = await openViewer(page, "image-viewer-1: 投稿", [
      "image-viewer-1: 画像",
    ]);

    await expect(viewer.getByRole("img")).toHaveAttribute(
      "src",
      /feed_fullsize/,
    );
    expect(new URL(page.url()).searchParams.has("thread")).toBe(false);
  });

  test("image-viewer-2: 画像が複数あるときは、前後の画像に切り替えられる", async ({
    page,
  }) => {
    const viewer = await openViewer(page, "image-viewer-2: 投稿", [
      "image-viewer-2: 画像1",
      "image-viewer-2: 画像2",
    ]);

    await viewer.getByRole("button", { name: "次の画像" }).click();
    await expect(
      viewer.getByRole("img", { name: "image-viewer-2: 画像2" }),
    ).toBeInViewport({ ratio: 1 });
    await viewer.getByRole("button", { name: "前の画像" }).click();
    await expect(
      viewer.getByRole("img", { name: "image-viewer-2: 画像1" }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("image-viewer-3: 拡大した画像の下にALTを表示する", async ({ page }) => {
    const viewer = await openViewer(page, "image-viewer-3: 投稿", [
      "image-viewer-3: 画像",
    ]);

    await expect(viewer.getByText("image-viewer-3: 画像")).toBeVisible();
  });

  test("image-viewer-4: 閉じるボタンかEscキーで閉じる", async ({ page }) => {
    const viewer = await openViewer(page, "image-viewer-4: 投稿", [
      "image-viewer-4: 画像",
    ]);

    await viewer.getByRole("button", { name: "画像を閉じる" }).click();
    await expect(viewer).toBeHidden();
    await page
      .getByRole("article")
      .filter({ hasText: "image-viewer-4: 投稿" })
      .getByRole("button", { name: "image-viewer-4: 画像" })
      .click();
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("image-viewer-5: 画像が複数あるときは、横スワイプで前後の画像に切り替えられる", async ({
    page,
  }) => {
    const viewer = await openViewer(page, "image-viewer-5: 投稿", [
      "image-viewer-5: 画像1",
      "image-viewer-5: 画像2",
    ]);
    const swipe = async (dx: number) => {
      const box = await viewer.boundingBox();
      if (!box) throw new Error("ビューアが表示されていない");
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 5 });
      await page.mouse.up();
    };

    await swipe(-100);
    await expect(
      viewer.getByRole("img", { name: "image-viewer-5: 画像2" }),
    ).toBeInViewport({ ratio: 1 });
    await swipe(100);
    await expect(
      viewer.getByRole("img", { name: "image-viewer-5: 画像1" }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("image-viewer-6: 拡大表示した画像は、ピンチ操作か拡大ボタンでさらにズームできる", async ({
    page,
  }) => {
    const viewer = await openViewer(page, "image-viewer-6: 投稿", [
      "image-viewer-6: 画像",
    ]);
    const image = viewer.getByRole("img");
    const width = async () => (await image.boundingBox())?.width ?? 0;
    const before = await width();

    await viewer.getByRole("button", { name: "拡大" }).click();
    await expect.poll(width).toBeGreaterThan(before);
  });
});
