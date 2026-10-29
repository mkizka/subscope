import { expect, test } from "@playwright/test";

const PDS_URL = "http://localhost:2583";

async function createRecords(text: string) {
  const session = await fetch(
    `${PDS_URL}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "alice.test", password: "password" }),
    },
  ).then(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (res) => res.json() as Promise<{ accessJwt: string; did: string }>,
  );
  const createRecord = (collection: string, record: object, rkey?: string) =>
    fetch(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection,
        rkey,
        record: { $type: collection, ...record },
      }),
    });
  await createRecord(
    "app.bsky.actor.profile",
    { displayName: "Alice" },
    "self",
  );
  await createRecord("app.bsky.feed.post", {
    text,
    createdAt: new Date().toISOString(),
  });
}

test.describe("プロフィール", () => {
  test("profile-1: 左カラムの「プロフィール」を選ぶと、中央カラムに自分のプロフィールが出る", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("ハンドル").fill("alice.test");
    await page.getByRole("button", { name: "ログイン" }).click();
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("button", { name: "Authorize" }).click();
    await page.waitForURL("/");

    const text = `profile-1の投稿 ${Date.now()}`;
    await createRecords(text);

    await expect(async () => {
      await page.reload();
      await page
        .getByRole("link", { name: "プロフィール" })
        .click({ timeout: 1000 });
    }).toPass();
    await page.waitForURL(/\/profile\//);

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Alice" })).toBeVisible();
    await expect(main.getByText(/^@/).first()).toBeVisible();
    await expect(main.getByText("0 フォロー", { exact: true })).toBeVisible();
    await expect(main.getByText("0 フォロワー", { exact: true })).toBeVisible();
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });
});
