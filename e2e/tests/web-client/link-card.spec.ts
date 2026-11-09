import { expect, test } from "@playwright/test";

import { createRecord, uploadImage } from "../../helpers/pds";

test.describe("リンクカード", () => {
  test("link-card-1: リンクカードのサムネイル・タイトル・説明を投稿の中に表示し、選ぶとリンク先を新しいタブで開く", async ({
    page,
  }) => {
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "link-card-1: リンク付きの投稿",
      embed: {
        $type: "app.bsky.embed.external",
        external: {
          uri: "https://example.com/link-card-1",
          title: "link-card-1: タイトル",
          description: "link-card-1: 説明",
          thumb: await uploadImage("alice.test"),
        },
      },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const card = page
      .getByRole("article")
      .filter({ hasText: "link-card-1: リンク付きの投稿" })
      .getByRole("link", { name: "link-card-1: タイトル" });
    await expect(async () => {
      await page.reload();
      await expect(card).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(card).toContainText("link-card-1: 説明");
    await expect(card).toHaveAttribute(
      "href",
      "https://example.com/link-card-1",
    );
    await expect(card).toHaveAttribute("target", "_blank");
    await expect(card.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
  });

  test("link-card-2: リンク先がx.com・twitter.comのツイートの場合は、リンクカードの代わりにツイートを埋め込んで表示する", async ({
    page,
  }) => {
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "link-card-2: ツイート付きの投稿",
      embed: {
        $type: "app.bsky.embed.external",
        external: {
          uri: "https://x.com/jack/status/20",
          title: "link-card-2: タイトル",
          description: "link-card-2: 説明",
        },
      },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const embed = page
      .getByRole("article")
      .filter({ hasText: "link-card-2: ツイート付きの投稿" })
      .locator("iframe");
    await expect(async () => {
      await page.reload();
      await expect(embed).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(embed).toHaveAttribute(
      "src",
      /^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?id=20&/,
    );
  });
});
