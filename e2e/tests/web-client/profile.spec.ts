import { expect, test } from "@playwright/test";

import {
  createRecord,
  follow,
  PDS_URL,
  putRecord,
  resolveHandle,
  uploadBlob,
  uploadImage,
} from "../../helpers/pds";

test.describe("プロフィール", () => {
  test("profile-e1: 左カラムの「プロフィール」から、中央カラムに自分のプロフィール（バナー、アイコン、名前、ハンドル、自己紹介、フォロー数、フォロワー数、投稿一覧）を表示する", async ({
    page,
  }) => {
    const text = `profile-1の投稿 ${Date.now()}`;
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      description: "profile-1の自己紹介",
      banner: await uploadImage("alice.test"),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await page.goto("/");

    await page.getByRole("link", { name: "プロフィール" }).click();

    await expect(page).toHaveURL(/\/alice\.test$/);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Alice" })).toBeVisible();
    await expect(main.getByText(/^@/).first()).toBeVisible();
    await expect(main.getByText(/^\d+ フォロー$/)).toBeVisible();
    await expect(main.getByText(/^\d+ フォロワー$/)).toBeVisible();
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
      await expect(main.getByText("profile-1の自己紹介")).toBeVisible({
        timeout: 1000,
      });
      await expect(main.locator('img[src*="/img/banner/"]')).toBeAttached({
        timeout: 1000,
      });
    }).toPass();
  });

  test("profile-e2: 全体ページのフォローボタンでそのアカウントをフォローし、もう一度押すと外す", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    const bob = await resolveHandle("bob.test");
    const isFollowing = async () => {
      const res = await fetch(
        `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=alice.test&collection=app.bsky.graph.follow`,
      );
      return (await res.text()).includes(bob);
    };
    await page.goto(`/${bob}`);
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(
        main.getByRole("button", { name: "フォロー中" }),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();

    await main.getByRole("button", { name: "フォロー中" }).click();
    await expect(
      main.getByRole("button", { name: "フォロー", exact: true }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: "フォロー", exact: true }),
    ).not.toHaveAttribute("aria-disabled", "true");
    await expect.poll(isFollowing).toBe(false);

    await main.getByRole("button", { name: "フォロー", exact: true }).click();
    await expect(
      main.getByRole("button", { name: "フォロー中" }),
    ).toBeVisible();
    await expect.poll(isFollowing).toBe(true);
  });

  test("profile-e3: 全体ページの「投稿」タブではリプライを除いた投稿を、「リプライ」タブではリプライを含めた投稿を表示する", async ({
    page,
  }) => {
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: `profile-7の投稿 ${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    const parent = await createRecord("bob.test", "app.bsky.feed.post", {
      text: `profile-7の親 ${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    const reply = `profile-7のリプライ ${Date.now()}`;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: reply,
      reply: { root: parent, parent },
      createdAt: new Date().toISOString(),
    });
    await page.goto("/alice.test?tab=replies");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(reply)).toBeVisible({ timeout: 1000 });
    }).toPass();

    await main.getByRole("tab", { name: "投稿" }).click();

    await expect(main.getByText(/^profile-7の投稿/).first()).toBeVisible();
    await expect(main.getByText(reply)).toHaveCount(0);
  });

  test("profile-e4: 全てのアカウントのプロフィールの「いいね」タブに、そのアカウントがいいねした投稿を表示する", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    const text = `profile-8の投稿 ${Date.now()}`;
    const subject = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await createRecord("bob.test", "app.bsky.feed.like", {
      subject,
      createdAt: new Date().toISOString(),
    });
    await page.goto("/bob.test");
    const main = page.getByRole("main");

    await main.getByRole("tab", { name: "いいね" }).click();

    await expect(page).toHaveURL("/bob.test?tab=likes");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("profile-e5: 全体ページの「メディア」タブには画像付きの投稿だけを表示する", async ({
    page,
  }) => {
    const image = `profile-10の画像付き ${Date.now()}`;
    const text = `profile-10のテキストのみ ${Date.now()}`;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: image,
      embed: {
        $type: "app.bsky.embed.images",
        images: [{ image: await uploadImage("alice.test"), alt: "" }],
      },
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await page.goto("/alice.test?tab=media");
    const main = page.getByRole("main");

    await expect(async () => {
      await page.reload();
      await expect(main.getByText(image)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(main.getByText(text)).toHaveCount(0);
  });

  test("profile-e11: 全体ページの「動画」タブには動画付きの投稿だけを表示する", async ({
    page,
  }) => {
    const video = `profile-e11の動画付き ${Date.now()}`;
    const text = `profile-e11のテキストのみ ${Date.now()}`;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: video,
      embed: {
        $type: "app.bsky.embed.video",
        video: await uploadBlob(
          "alice.test",
          new Uint8Array([0, 0, 0, 24]),
          "video/mp4",
        ),
        alt: video,
        aspectRatio: { width: 16, height: 9 },
      },
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await page.route("https://video.bsky.app/watch/**/thumbnail.jpg", (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.goto("/alice.test?tab=video");
    const main = page.getByRole("main");

    await expect(async () => {
      await page.reload();
      await expect(main.getByText(video)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(main.getByText(text)).toHaveCount(0);
  });

  test("profile-e6: タイムラインとスレッドの投稿のアイコンか名前を選ぶと、投稿者のプロフィール全体ページに移動する", async ({
    page,
  }) => {
    const text = `profile-12の投稿 ${Date.now()}`;
    const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    const article = page.getByRole("main").getByRole("article").filter({
      hasText: text,
    });
    await page.goto("/");
    await expect(async () => {
      await page.reload();
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();

    await article.locator('a[href="/alice.test"]').first().click();
    await expect(page).toHaveURL("/alice.test");

    await page.goto(`/alice.test/post/${uri.split("/").pop()}`);
    await page
      .getByRole("article", { name: "選んだ投稿" })
      .getByRole("link", { name: /@alice\.test/ })
      .click();
    await expect(page).toHaveURL("/alice.test");
  });

  test("profile-e7: 一度表示したプロフィールに戻ると、読み込み直しを待たずに前回の内容を表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");
    const followers = page.getByRole("main").getByText(/^\d+ フォロワー$/);
    await expect(followers).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "通知", exact: true })
      .click();
    await expect(page).toHaveURL("/notifications");
    await page.route("**/api/profile/*", () => {});

    await page.goBack();

    await expect(followers).toBeVisible();
  });

  test("profile-e8: 全体ページの「投稿」タブでは自分の投稿への自分のリプライ(スレッド)を含め、timeline-s6と同じく線で繋げる", async ({
    page,
  }) => {
    const root = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "profile-16: 起点",
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "profile-16: 返信",
      reply: { root, parent: root },
      createdAt: new Date().toISOString(),
    });
    await page.goto("/alice.test");
    const main = page.getByRole("main");

    await expect(async () => {
      await page.reload();
      await expect(main.getByText(/^profile-16: /)).toHaveText(
        ["profile-16: 起点", "profile-16: 返信"],
        { timeout: 1000 },
      );
    }).toPass();
    await expect(
      main
        .getByRole("article")
        .filter({ hasText: "profile-16: " })
        .getByTestId("thread-line"),
    ).toHaveCount(2);
  });

  test("profile-e9: 「リプライ」タブでは、返信先の投稿が一覧にない場合、リプライの上に返信先を表示して線で繋げる", async ({
    page,
  }) => {
    const parentText = `profile-17の親 ${Date.now()}`;
    const reply = `profile-17のリプライ ${Date.now()}`;
    const parent = await createRecord("bob.test", "app.bsky.feed.post", {
      text: parentText,
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: reply,
      reply: { root: parent, parent },
      createdAt: new Date().toISOString(),
    });
    await page.goto("/alice.test?tab=replies");
    const main = page.getByRole("main");

    await expect(async () => {
      await page.reload();
      await expect(main.getByText(reply)).toBeVisible({ timeout: 1000 });
    }).toPass();

    await expect(main).toContainText(
      new RegExp(`${parentText}[\\s\\S]*${reply}`),
    );
  });

  test("profile-e10: 全体ページの各タブ（投稿・リプライ・メディア・いいね）は、一番下の2画面分手前までスクロールすると、続きの古い投稿を読み込む", async ({
    page,
  }) => {
    for (let i = 1; i <= 25; i++) {
      await createRecord("alice.test", "app.bsky.feed.post", {
        text: `profile-23: 投稿${i}`,
        createdAt: new Date().toISOString(),
      });
    }
    await page.goto("/alice.test");
    const main = page.getByRole("main");
    const oldestPost = main.getByText("profile-23: 投稿1", { exact: true });
    await expect(async () => {
      await page.reload();
      await expect(main.getByText("profile-23: 投稿25")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(oldestPost).toHaveCount(0);

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight - window.innerHeight * 2.5),
    );

    await expect(oldestPost).toBeAttached();
  });
});
