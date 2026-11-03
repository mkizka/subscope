import { expect, test } from "@playwright/test";

import {
  createRecord,
  follow,
  PDS_URL,
  putRecord,
  resolveHandle,
  uploadImage,
} from "../../helpers/pds";

test.describe("プロフィール", () => {
  test("profile-1: 左カラムの「プロフィール」から、中央カラムに自分のプロフィール（バナー、アイコン、名前、ハンドル、自己紹介、フォロー数、フォロワー数、投稿一覧）を表示する", async ({
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

  test("profile-20: プロフィールの自己紹介の下に、プロフィールに設定されたリンクを表示する。表示名（なければドメイン）を選ぶと、リンク先を新しいタブで開く", async ({
    page,
  }) => {
    const link = await createRecord("alice.test", "app.bsky.actor.link", {
      url: "https://example.com/profile-20",
      title: "profile-20のリンク",
      createdAt: new Date().toISOString(),
    });
    const noTitle = await createRecord("alice.test", "app.bsky.actor.link", {
      url: "https://example.org/profile-20",
      createdAt: new Date().toISOString(),
    });
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
      links: [link, noTitle],
    });

    await page.goto("/alice.test");

    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(
        main.getByRole("link", { name: "profile-20のリンク" }),
      ).toHaveAttribute("href", "https://example.com/profile-20", {
        timeout: 1000,
      });
    }).toPass();
    await expect(
      main.getByRole("link", { name: "example.org" }),
    ).toHaveAttribute("target", "_blank");
  });

  test("profile-5: 全体ページのフォローボタンでそのアカウントをフォローし、もう一度押すと外す", async ({
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

  test("profile-6: 自分のプロフィールにはフォローボタンを出さない", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "プロフィール" }).click();

    const main = page.getByRole("main");
    await expect(main.getByText(/^\d+ フォロワー$/)).toBeVisible();
    await expect(main.getByRole("button", { name: /^フォロー/ })).toHaveCount(
      0,
    );
  });
  test("profile-7: 全体ページの「投稿」タブではリプライを除いた投稿を、「リプライ」タブではリプライを含めた投稿を表示する", async ({
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

  test("profile-17: 「リプライ」タブでは、返信先の投稿が一覧にない場合、リプライの上に返信先を表示して線で繋げる", async ({
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

  test("profile-16: 全体ページの「投稿」タブでは、自分の投稿への自分のリプライ(スレッド)を含め、timeline-13と同じく線で繋げる", async ({
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

  test("profile-8: 自分のプロフィールの「いいね」タブに、自分がいいねした投稿を表示する", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    const text = `profile-8の投稿 ${Date.now()}`;
    const subject = await createRecord("bob.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.like", {
      subject,
      createdAt: new Date().toISOString(),
    });
    await page.goto("/alice.test");
    const main = page.getByRole("main");

    await main.getByRole("tab", { name: "いいね" }).click();

    await expect(page).toHaveURL("/alice.test?tab=likes");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("profile-9: 他のアカウントのプロフィールには「いいね」タブを出さない", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await page.goto("/bob.test");

    const main = page.getByRole("main");
    await expect(main.getByRole("tab", { name: "リプライ" })).toBeVisible();
    await expect(main.getByRole("tab", { name: "いいね" })).toHaveCount(0);
  });

  test("profile-10: 全体ページの「メディア」タブには、画像付きの投稿だけを表示する", async ({
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

  test("profile-11: フォローボタンは、押した結果を画面に反映し終えるまで押せない", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    const bob = await resolveHandle("bob.test");
    await page.goto(`/${bob}`);
    const button = page
      .getByRole("main")
      .getByRole("button", { name: /^フォロー/ });
    await expect(async () => {
      await page.reload();
      await expect(button).toBeVisible({ timeout: 1000 });
    }).toPass();
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) => url.pathname.startsWith("/api/follows"),
      async (route) => {
        await held;
        await route.continue();
      },
      { times: 1 },
    );
    const initial = (await button.textContent()) ?? "";
    await button.click();
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    release();
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
    await expect(button).not.toHaveText(initial);
  });

  test("profile-12: タイムラインとスレッドの投稿のアイコンか名前を選ぶと、投稿者のプロフィール全体ページに移動する", async ({
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

  test("profile-13: 追跡アカウントの全体ページには、そのアカウントの過去の投稿の同期状態（同期中・同期済み・同期エラー）をハンドルの横に表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");

    await expect(async () => {
      await page.reload();
      await expect(
        page.getByRole("main").getByText("同期済み", { exact: true }),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("profile-14: プロフィールを開くと、読み込みを待たずにハンドルとタブを表示し、表示名・自己紹介・フォロー数・フォロワー数・投稿の場所には読み込み終えるまで灰色の骨組み（スケルトン）を表示する", async ({
    page,
  }) => {
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {
      displayName: "Alice",
    });
    await page.goto("/accounts");
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route("**/api/profile/*", async (route) => {
      await released;
      await route.continue();
    });

    await page.getByRole("link", { name: "プロフィール" }).click();

    const main = page.getByRole("main");
    const skeleton = main.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    await expect(main.getByText(/^@/).first()).toBeVisible();
    await expect(main.getByRole("tab", { name: "投稿" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1 })).not.toHaveText(/\S/);
    await expect(main.getByText(/^\d+ フォロー$/)).toBeHidden();
    release(undefined);
    await expect(skeleton).toBeHidden();
    await expect(main.getByRole("heading", { name: "Alice" })).toBeVisible();
    await expect(main.getByText(/^\d+ フォロー$/)).toBeVisible();
  });

  test("profile-18: タブを切り替えると、ヘッダーとタブはそのままにして、投稿の場所だけ読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");
    const main = page.getByRole("main");
    const followers = main.getByText(/^\d+ フォロワー$/);
    await expect(followers).toBeVisible();
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(
      (url) =>
        url.pathname.startsWith("/api/profile/") &&
        url.searchParams.get("tab") === "media",
      async (route) => {
        await released;
        await route.continue();
      },
    );

    await main.getByRole("tab", { name: "メディア" }).click();

    const skeleton = main.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    await expect(followers).toBeVisible();
    await expect(main.getByRole("tab", { name: "メディア" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("profile-19: 「リスト」タブから他のタブに切り替えても、ヘッダーとタブはそのままにして、投稿の場所だけ読み込み終えるまでスケルトンを表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test/lists");
    const main = page.getByRole("main");
    const followers = main.getByText(/^\d+ フォロワー$/);
    await expect(followers).toBeVisible();
    const { promise: released, resolve: release } = Promise.withResolvers();
    await page.route(
      (url) =>
        url.pathname.startsWith("/api/profile/") &&
        url.searchParams.get("tab") === "media",
      async (route) => {
        await released;
        await route.continue();
      },
    );

    await main.getByRole("tab", { name: "メディア" }).click();

    const skeleton = main.getByRole("status", {
      name: "読み込み中",
      exact: true,
    });
    await expect(skeleton).toBeVisible();
    await expect(followers).toBeVisible();
    release(undefined);
    await expect(skeleton).toBeHidden();
  });

  test("profile-15: 一度表示したプロフィールに戻ると、読み込み直しを待たずに前回の内容を表示する", async ({
    page,
  }) => {
    await page.goto("/alice.test");
    const followers = page.getByRole("main").getByText(/^\d+ フォロワー$/);
    await expect(followers).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "アカウント", exact: true })
      .click();
    await expect(page).toHaveURL("/accounts");
    await page.route("**/api/profile/*", () => {});

    await page.goBack();

    await expect(followers).toBeVisible();
  });
});
