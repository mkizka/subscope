import { AtUri } from "@atproto/syntax";
import { expect, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

test.describe("引用投稿", () => {
  test("quote-e1: 引用されている投稿をタップすると、そのスレッドを開く", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", {
      $type: "app.bsky.feed.post",
      text: "quote-e1: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", {
      $type: "app.bsky.feed.post",
      text: "quote-e1: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const link = page
      .getByRole("article")
      .filter({ hasText: "quote-e1: 引用した投稿" })
      .getByRole("link", { name: "引用された投稿のスレッドを開く" });
    await expect(async () => {
      await page.reload();
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();

    await expect(page).toHaveURL(
      `/alice.test/post/${new AtUri(quoted.uri).rkey}`,
    );
    await expect(page.getByLabel("選んだ投稿")).toContainText(
      "quote-e1: 引用される投稿",
    );
  });
});

test.describe("引用一覧", () => {
  test("quotes-e1: 選んだ投稿に引用があるときは「N件の引用」を表示し、押すと引用一覧を開く", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", {
      $type: "app.bsky.feed.post",
      text: "quotes-e1: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", {
      $type: "app.bsky.feed.post",
      text: "quotes-e1: 引用した投稿",
      embed: { $type: "app.bsky.embed.record", record: quoted },
      createdAt: new Date().toISOString(),
    });
    const rkey = new AtUri(quoted.uri).rkey;

    await page.goto("/");
    const link = page.getByRole("link", { name: "1件の引用" });
    await expect(async () => {
      await page.goto(`/alice.test/post/${rkey}`);
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();

    await expect(page).toHaveURL(`/alice.test/post/${rkey}/quotes`);
    await expect(
      page.getByRole("region", { name: "引用" }).getByRole("article"),
    ).toContainText("quotes-e1: 引用した投稿");
  });

  test("quotes-e2: 引用した投稿を新しい順に並べる", async ({ page }) => {
    const quoted = await createRecord("alice.test", {
      $type: "app.bsky.feed.post",
      text: "quotes-e2: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    for (const n of [1, 2]) {
      await createRecord("alice.test", {
        $type: "app.bsky.feed.post",
        text: `quotes-e2: 引用${n}`,
        embed: { $type: "app.bsky.embed.record", record: quoted },
        createdAt: new Date().toISOString(),
      });
    }

    await page.goto("/");
    const articles = page
      .getByRole("region", { name: "引用" })
      .getByRole("article");
    await expect(async () => {
      await page.goto(`/alice.test/post/${new AtUri(quoted.uri).rkey}/quotes`);
      await expect(articles).toHaveCount(2, { timeout: 1000 });
    }).toPass();

    await expect(articles.getByText(/^quotes-e2: 引用\d$/)).toHaveText([
      "quotes-e2: 引用2",
      "quotes-e2: 引用1",
    ]);
  });
});
