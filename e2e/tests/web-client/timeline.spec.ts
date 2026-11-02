import { type APIRequestContext, expect, test } from "@playwright/test";

import {
  createRecord,
  follow,
  PDS_URL,
  putRecord,
  resolveHandle,
} from "../../helpers/pds";

const createPosts = async (request: APIRequestContext, texts: string[]) => {
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
  for (const text of texts) {
    await request.post(`${PDS_URL}/xrpc/com.atproto.repo.createRecord`, {
      headers: { Authorization: `Bearer ${accessJwt}` },
      data: {
        repo: did,
        collection: "app.bsky.feed.post",
        record: { text, createdAt: new Date().toISOString() },
      },
    });
  }
};

test.describe("タイムライン", () => {
  test("timeline-1: 自分とフォロー先の投稿を、新しいものほど上に並べる", async ({
    page,
    request,
  }) => {
    const texts = ["timeline-1: 古い投稿", "timeline-1: 新しい投稿"];
    await createPosts(request, texts);
    texts.reverse();

    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("timeline-4: 一番下の2画面分手前までスクロールすると、続きの古い投稿を読み込む", async ({
    page,
    request,
  }) => {
    const texts = Array.from(
      { length: 55 },
      (_, i) => `timeline-4: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    const oldestPost = page.getByText("timeline-4: 投稿1", { exact: true });
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-4: 投稿55")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(oldestPost).toHaveCount(0);

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight - window.innerHeight * 2.5),
    );

    await expect(oldestPost).toBeAttached();
  });

  test("timeline-9: 投稿は1回に50件ずつ読み込む", async ({ page, request }) => {
    const texts = Array.from(
      { length: 55 },
      (_, i) => `timeline-9: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-9: 投稿55")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await expect(
      page.getByText("timeline-9: 投稿6", { exact: true }),
    ).toBeAttached();
    await expect(
      page.getByText("timeline-9: 投稿5", { exact: true }),
    ).toHaveCount(0);
  });

  test("timeline-10: 続きの古い投稿を読み込み終えるまで、一覧の下にスピナーを表示する", async ({
    page,
    request,
  }) => {
    const texts = Array.from(
      { length: 51 },
      (_, i) => `timeline-10: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-10: 投稿51")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(/cursor=/, async (route) => {
      await released;
      await route.continue();
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const spinner = page.getByRole("status", { name: "続きを読み込み中" });
    await expect(spinner).toBeVisible();
    release(undefined);
    await expect(
      page.getByText("timeline-10: 投稿1", { exact: true }),
    ).toBeAttached();
  });

  test("timeline-5: 投稿の時刻は、ブラウザの現在時刻からの経過時間で表示する", async ({
    page,
    request,
  }) => {
    const text = "timeline-5: 投稿";
    await createPosts(request, [text]);
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.clock.setFixedTime(Date.now() + 3 * 60 * 60 * 1000);

    const article = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.goto("/");
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();

    await expect(article.getByText("3時間")).toBeVisible();
    expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
  });

  test("timeline-2: いいね数・リポスト数は1以上のときだけ表示する", async ({
    page,
  }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {});
    const post = (text: string) =>
      createRecord("alice.test", "app.bsky.feed.post", {
        text,
        createdAt: new Date().toISOString(),
      });
    const subject = await post("timeline-2: 反応あり");
    for (const collection of ["app.bsky.feed.like", "app.bsky.feed.repost"]) {
      await createRecord("alice.test", collection, {
        subject,
        createdAt: new Date().toISOString(),
      });
    }
    await post("timeline-2: 反応なし");

    await page.goto("/");

    const reacted = page
      .getByRole("article")
      .filter({ hasText: "timeline-2: 反応あり" })
      .last();
    await expect(async () => {
      await page.reload();
      await expect(reacted.getByTitle("1件のいいね")).toBeVisible({
        timeout: 1000,
      });
      await expect(reacted.getByTitle("1件のリポスト")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    const notReacted = page
      .getByRole("article")
      .filter({ hasText: "timeline-2: 反応なし" });
    await expect(notReacted.getByTitle(/いいね/)).toHaveCount(0);
    await expect(notReacted.getByTitle(/リポスト/)).toHaveCount(0);
  });

  test("timeline-3: 返信先かスレッドの起点が他人の投稿であるリプライは含めず、親投稿に返信の件数を表示する", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {});
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-3: 親投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: "timeline-3: 返信",
      reply: { root: parent, parent },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");

    const parentPost = page
      .getByRole("article")
      .filter({ hasText: "timeline-3: 親投稿" });
    await expect(async () => {
      await page.reload();
      await expect(parentPost.getByTitle("1件の返信")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(page.getByText("timeline-3: 返信")).toHaveCount(0);
  });

  test("timeline-8: 返信先とスレッドの起点がどちらも投稿者自身の投稿であるリプライは含める", async ({
    page,
  }) => {
    const root = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-8: 起点",
      createdAt: new Date().toISOString(),
    });
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-8: 1つ目の返信",
      reply: { root, parent: root },
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-8: 2つ目の返信",
      reply: { root, parent },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-8: /)).toHaveText(
        [
          "timeline-8: 2つ目の返信",
          "timeline-8: 1つ目の返信",
          "timeline-8: 起点",
        ],
        { timeout: 1000 },
      );
    }).toPass();
  });

  test("timeline-6: 本文のうちfacetsでリンクが付いた範囲は、そのURLを新しいタブで開くリンクにする", async ({
    page,
  }) => {
    const prefix = "timeline-6: 日本語のあと ";
    const label = "example.com/timeline-6...";
    const byteStart = new TextEncoder().encode(prefix).length;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: `${prefix}${label} 後ろ`,
      facets: [
        {
          index: {
            byteStart,
            byteEnd: byteStart + new TextEncoder().encode(label).length,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://example.com/timeline-6/full",
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(async () => {
      await page.reload();
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(link).toHaveAttribute(
      "href",
      "https://example.com/timeline-6/full",
    );
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("timeline-7: 本文のうちfacetsでメンションが付いた範囲は、そのアカウントのプロフィール全体ページへのリンクにする", async ({
    page,
  }) => {
    const prefix = "timeline-7: こんにちは ";
    const label = "@alice.test";
    const byteStart = new TextEncoder().encode(prefix).length;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: `${prefix}${label} さん`,
      facets: [
        {
          index: { byteStart, byteEnd: byteStart + label.length },
          features: [
            {
              $type: "app.bsky.richtext.facet#mention",
              did: await resolveHandle("alice.test"),
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");
    const link = page
      .getByRole("main")
      .getByRole("article")
      .filter({ hasText: prefix })
      .getByRole("link", { name: label, exact: true });
    await expect(async () => {
      await page.reload();
      await expect(link).toBeVisible({ timeout: 1000 });
    }).toPass();
    await link.click();
    await expect(page).toHaveURL(
      `/profile/${await resolveHandle("alice.test")}`,
    );
  });
});
