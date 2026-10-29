import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord } from "./pds";

const createThread = async (id: string) => {
  const parentText = `${id}: 親投稿`;
  const replyText = `${id}: 返信`;
  const parent = await createRecord("alice.test", "app.bsky.feed.post", {
    text: parentText,
    createdAt: new Date().toISOString(),
  });
  const reply = await createRecord("alice.test", "app.bsky.feed.post", {
    text: replyText,
    reply: { root: parent, parent },
    createdAt: new Date().toISOString(),
  });
  return { parent, reply, parentText, replyText };
};

test.describe("スレッド", () => {
  test("thread-1: タイムラインの投稿を選ぶと、右カラムにその投稿のスレッド（親投稿と返信）が出る", async ({
    page,
  }) => {
    const { parentText, replyText } = await createThread("thread-1");

    await login(page);
    const post = page.getByRole("article").filter({ hasText: parentText });
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();
    await post.getByRole("link", { name: "スレッドを開く" }).click();

    const panel = page.getByRole("region", { name: "スレッド" });
    await expect(panel.getByText(parentText)).toBeVisible();
    await expect(panel.getByText(replyText)).toBeVisible();
  });

  test("thread-2: URLの ?thread=投稿のAT URI で、右カラムにその投稿のスレッドが開く", async ({
    page,
  }) => {
    const { reply, parentText, replyText } = await createThread("thread-2");

    await login(page);
    await page.waitForURL("/");
    const panel = page.getByRole("region", { name: "スレッド" });
    await expect(async () => {
      await page.goto(`/?${new URLSearchParams({ thread: reply.uri })}`);
      await expect(panel.getByText(replyText)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(panel.getByText(parentText)).toBeVisible();
  });

  test("thread-3: スレッドを閉じると、右カラムが通知に戻る", async ({
    page,
  }) => {
    const { parent } = await createThread("thread-3");

    await login(page);
    await page.waitForURL("/");
    await page.goto(`/?${new URLSearchParams({ thread: parent.uri })}`);
    await page.getByRole("link", { name: "閉じる" }).click();

    await expect(page.getByRole("heading", { name: "通知" })).toBeVisible();
    await expect(page).toHaveURL("/");
  });
});
