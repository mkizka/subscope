import { expect, type Page, test } from "@playwright/test";

import { createRecord, uploadBlob } from "../../helpers/pds";

const THUMBNAIL = "https://video.bsky.app/watch/**/thumbnail.jpg";
const PLAYLIST = "https://video.bsky.app/watch/**/playlist.m3u8";

async function postVideo(text: string) {
  return createRecord("alice.test", "app.bsky.feed.post", {
    text,
    embed: {
      $type: "app.bsky.embed.video",
      video: await uploadBlob(
        "alice.test",
        new Uint8Array([0, 0, 0, 24]),
        "video/mp4",
      ),
      alt: text,
      aspectRatio: { width: 16, height: 9 },
    },
    createdAt: new Date().toISOString(),
  });
}

async function open(page: Page, text: string) {
  await page.route(THUMBNAIL, (route) => route.fulfill({ status: 404 }));
  const post = page.getByRole("article").filter({ hasText: text });
  await page.goto("/");
  await expect(async () => {
    await page.reload();
    await expect(post).toBeVisible({ timeout: 1000 });
  }).toPass();
  return post;
}

test.describe("投稿動画", () => {
  test("post-video-e1: 再生ボタンを押すとplaylistを取得して再生を始める", async ({
    page,
  }) => {
    const text = `post-video-e1: ${Date.now()}`;
    await postVideo(text);
    const post = await open(page, text);

    await page.route(PLAYLIST, (route) =>
      route.fulfill({
        contentType: "application/vnd.apple.mpegurl",
        body: "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-ENDLIST\n",
      }),
    );
    const requested = page.waitForRequest(PLAYLIST);
    await post.locator('[slot="centered-chrome"]').click();
    await requested;
  });
});
