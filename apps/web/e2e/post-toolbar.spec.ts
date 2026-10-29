import { expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

const cases = [
  { id: "post-toolbar-1", name: "いいね", collection: "app.bsky.feed.like" },
  {
    id: "post-toolbar-2",
    name: "リポスト",
    collection: "app.bsky.feed.repost",
  },
];

for (const { id, name, collection } of cases) {
  test(`${id}: ${name}ボタンで投稿に${name}し、もう一度押すと取り消す`, async ({
    page,
    request,
  }) => {
    const session = await request.post(
      `${PDS_URL}/xrpc/com.atproto.server.createSession`,
      { data: { identifier: "alice.test", password: "password" } },
    );
    const { did, accessJwt } = await session.json();
    const createRecord = (collection: string, record: object, rkey?: string) =>
      request.post(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
        headers: { Authorization: `Bearer ${accessJwt}` },
        data: { repo: did, collection, rkey, record },
      });
    await createRecord(
      "app.bsky.actor.profile",
      { displayName: "Alice" },
      "self",
    );
    const text = `${id}: 投稿`;
    const created = await createRecord("app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    const { uri }: { uri: string } = await created.json();
    const hasRecord = async () => {
      const res = await request.get(
        `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=${collection}`,
      );
      return (await res.text()).includes(uri);
    };

    await login(page);
    const post = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.reload();
      await expect(post).toBeVisible({ timeout: 1000 });
    }).toPass();
    const button = post.getByRole("button", { name });

    await post.hover();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect.poll(hasRecord).toBe(true);

    await post.hover();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect.poll(hasRecord).toBe(false);
  });
}
