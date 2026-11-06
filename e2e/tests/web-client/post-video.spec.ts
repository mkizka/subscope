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
  test("post-video-1: 動画はサムネイルを表示し、ALTをプレイヤーのラベルにする", async ({
    page,
  }) => {
    const text = `post-video-1: ${Date.now()}`;
    await postVideo(text);
    const post = await open(page, text);

    const video = post.getByLabel(text);
    await expect(video).toHaveJSProperty("tagName", "VIDEO");
    await expect(video).toHaveAttribute("poster", /thumbnail\.jpg$/);
  });

  test("post-video-2: 動画を再生すると、hls.jsでplaylistを取得して再生を始める", async ({
    page,
  }) => {
    const text = `post-video-2: ${Date.now()}`;
    await postVideo(text);
    const post = await open(page, text);

    await page.route(PLAYLIST, (route) =>
      route.fulfill({
        contentType: "application/vnd.apple.mpegurl",
        body: "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-ENDLIST\n",
      }),
    );
    const requested = page.waitForRequest(PLAYLIST);
    const video = post.getByLabel(text);
    await video.evaluate((el: HTMLVideoElement) => {
      void el.play().catch(() => undefined);
    });
    await requested;
    await expect(video).toHaveAttribute("src", /^blob:/);
  });

  test("post-video-3: 引用された投稿に付いた動画を、引用した投稿の中に表示する", async ({
    page,
  }) => {
    const text = `post-video-3: ${Date.now()}`;
    const quoted = await postVideo(`post-video-3-quoted: ${Date.now()}`);
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });
    const post = await open(page, text);

    await expect(post.locator("blockquote").getByLabel(/quoted/)).toBeVisible();
  });
});
