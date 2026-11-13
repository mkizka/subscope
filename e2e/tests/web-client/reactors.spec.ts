import { expect, type Page, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

const openList = async (
  page: Page,
  id: string,
  collection: string,
  label: string,
  path: string,
) => {
  const subject = await createRecord("bob.test", "app.bsky.feed.post", {
    text: `${id}: ${label}される投稿`,
    createdAt: new Date().toISOString(),
  });
  await createRecord("alice.test", collection, {
    subject,
    createdAt: new Date().toISOString(),
  });
  const rkey = subject.uri.split("/").pop();

  await page.goto("/");
  const link = page.getByRole("link", { name: `1件の${label}` });
  await expect(async () => {
    await page.goto(`/bob.test/post/${rkey}`);
    await expect(link).toBeVisible({ timeout: 1000 });
  }).toPass();
  await link.click();

  await expect(page).toHaveURL(`/bob.test/post/${rkey}/${path}`);
  await expect(page.getByRole("region", { name: label })).toContainText(
    "@alice.test",
  );
};

test("reactors-e1: スレッドの選んだ投稿にリポストがあるときは「N件のリポスト」を押すと、リポストしたアカウントの一覧を開く", async ({
  page,
}) => {
  await openList(
    page,
    "reactors-e1",
    "app.bsky.feed.repost",
    "リポスト",
    "reposted-by",
  );
});

test("reactors-e2: スレッドの選んだ投稿にいいねがあるときは「N件のいいね」を押すと、いいねしたアカウントの一覧を開く", async ({
  page,
}) => {
  await openList(
    page,
    "reactors-e2",
    "app.bsky.feed.like",
    "いいね",
    "liked-by",
  );
});
