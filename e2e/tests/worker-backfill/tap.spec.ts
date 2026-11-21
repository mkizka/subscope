import { expect, test } from "@playwright/test";

import { createRecord, follow, registerAccount } from "../../helpers/pds";

test("tap-7: 登録されたアカウントは、Tapに追加済みでも外して追加し直し、全レコードを受け取り直す", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await follow("alice.test", "erin.test");
  await follow("alice.test", "ivan.test");
  const subject = await createRecord("erin.test", "app.bsky.feed.post", {
    text: "tap-7: メンバー以外の投稿",
    createdAt: new Date().toISOString(),
  });
  await createRecord("ivan.test", "app.bsky.feed.like", {
    subject,
    createdAt: new Date().toISOString(),
  });
  const delivered = await createRecord("ivan.test", "app.bsky.feed.post", {
    text: "tap-7: いいねのあとの投稿",
    createdAt: new Date().toISOString(),
  });
  await page.goto("/");
  await expect(async () => {
    await page.goto(`/ivan.test/post/${delivered.uri.split("/").pop()}`);
    await expect(page.getByText("tap-7: いいねのあとの投稿")).toBeVisible({
      timeout: 1000,
    });
  }).toPass();

  const response = await page.request.post("/admin/api/invite-codes");
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { code } = (await response.json()) as { code: string };
  await registerAccount("ivan.test", code);

  await expect(async () => {
    await page.goto(`/erin.test/post/${subject.uri.split("/").pop()}`);
    await expect(page.getByRole("link", { name: "1件のいいね" })).toBeVisible({
      timeout: 1000,
    });
  }).toPass();
});
