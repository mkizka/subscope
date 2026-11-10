import { expect, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

test.describe("引用投稿", () => {
  test("quote-e1: 引用されている投稿をタップすると、その投稿のスレッドを開く", async ({
    page,
  }) => {
    const quoted = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "quote-e1: 引用される投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
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
      `/alice.test/post/${quoted.uri.split("/").pop()}`,
    );
    await expect(page.getByLabel("選んだ投稿")).toContainText(
      "quote-e1: 引用される投稿",
    );
  });
});
