import { expect, test } from "@playwright/test";

import { login } from "./login";

const PDS_URL = "http://localhost:2583";

const image = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
});

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

  test("post-form-3: 画像を添付してALTを入力して投稿すると、タイムラインの投稿にALT付きの画像が表示される", async ({
    page,
  }) => {
    const alt = `post-form-3: ${Date.now()}`;
    await page.getByLabel("画像を追加").setInputFiles(image("a.png"));
    await page.getByRole("textbox", { name: "画像1のALT" }).fill(alt);
    await page.getByRole("button", { name: "投稿", exact: true }).click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByRole("img", { name: alt })).toBeAttached({
        timeout: 1000,
      });
    }).toPass();
  });

  test("post-form-4: 画像は4枚まで添付でき、4枚添付すると画像を追加できない", async ({
    page,
  }) => {
    const input = page.getByLabel("画像を追加");
    await input.setInputFiles(
      ["1", "2", "3", "4"].map((n) => image(`${n}.png`)),
    );

    await expect(page.getByRole("textbox", { name: /のALT$/ })).toHaveCount(4);
    await expect(input).toBeDisabled();
  });
});
