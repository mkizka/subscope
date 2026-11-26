import { AtUri } from "@atproto/syntax";
import { expect, type Page, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

const openList = async (
  page: Page,
  id: string,
  collection: string,
  label: string,
  path: string,
) => {
  const subject = await createRecord("bob.test", {
    $type: "app.bsky.feed.post",
    text: `${id}: ${label}される投稿`,
    createdAt: new Date().toISOString(),
  });
  await createRecord("alice.test", {
    $type: collection,
    subject,
    createdAt: new Date().toISOString(),
  });
  const rkey = new AtUri(subject.uri).rkey;

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

test("reactors-e1: 「N件のリポスト」を押すと、リポストしたアカウントの一覧を開く", async ({
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

test("reactors-e2: 「N件のいいね」を押すと、いいねしたアカウントの一覧を開く", async ({
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
