import { expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

test.describe("投稿欄", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "いまどうしてる？" }).click();
  });

  test("post-form-1: 畳んだ投稿欄をクリックすると広がり、投稿した内容がタイムラインの一番下に表示される", async ({
    page,
    request,
  }) => {
    const session = await request.post(
      `${PDS_URL}/xrpc/com.atproto.server.createSession`,
      { data: { identifier: "alice.test", password: "password" } },
    );
    const { did, accessJwt } = await session.json();
    await request.post(`${PDS_URL}/xrpc/com.atproto.repo.putRecord`, {
      headers: { Authorization: `Bearer ${accessJwt}` },
      data: {
        repo: did,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record: { displayName: "Alice" },
      },
    });
    const text = `post-form-1: ${Date.now()}`;
    await page.getByRole("textbox", { name: "投稿内容" }).fill(text);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^post-form-1: /).last()).toHaveText(text, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("post-form-2: 300字を超えると投稿ボタンを押せない", async ({ page }) => {
    const textbox = page.getByRole("textbox", { name: "投稿内容" });
    const submit = page.getByRole("button", { name: "投稿", exact: true });

    await textbox.fill("あ".repeat(300));
    await expect(submit).toBeEnabled();
    await textbox.fill("あ".repeat(301));
    await expect(submit).toBeDisabled();
  });
});
