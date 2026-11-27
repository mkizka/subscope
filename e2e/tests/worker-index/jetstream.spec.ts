import { AtUri } from "@atproto/syntax";
import { expect, test } from "@playwright/test";

import { createRecord, follow } from "../../helpers/pds";

test("jetstream-1: 追跡アカウントの投稿を保存する", async ({ page }) => {
  await follow("alice.test", "erin.test");

  await expect(async () => {
    const post = await createRecord("erin.test", {
      $type: "app.bsky.feed.post",
      text: "jetstream-1: 追跡アカウントの投稿",
      createdAt: new Date().toISOString(),
    });
    await page.goto(`/erin.test/post/${new AtUri(post.uri).rkey}`);
    await expect(
      page.getByText("jetstream-1: 追跡アカウントの投稿"),
    ).toBeVisible({ timeout: 3000 });
  }).toPass();
});
