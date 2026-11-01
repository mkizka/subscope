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

    await expect(page).toHaveURL(/\/profile\//);
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

  test.describe("簡易表示", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/?profile=alice.test");
    });

    test("profile-2: URLに ?profile=ハンドル があると、右カラムにそのユーザーのプロフィールの簡易表示を開く", async ({
      page,
    }) => {
      const panel = page.getByRole("region", { name: "プロフィール" });
      await expect(panel.getByText("@alice.test")).toBeVisible();
      await expect(panel.getByText("フォロワー")).toBeVisible();
    });

    test("profile-3: 簡易表示を閉じると、右カラムを通知に戻す", async ({
      page,
    }) => {
      await page.getByRole("link", { name: "閉じる" }).click();

      await expect(page.getByRole("heading", { name: "通知" })).toBeVisible();
      await expect(page).toHaveURL("/");
    });

    test("profile-4: 簡易表示から、中央カラムのプロフィール全体ページに移動できる", async ({
      page,
    }) => {
      await page.getByRole("link", { name: "プロフィール全体を見る" }).click();

      await expect(page).toHaveURL("/profile/alice.test");
    });
  });

  test("profile-5: 全体ページのフォローボタンでそのユーザーをフォローし、もう一度押すと外す", async ({
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
    await page.goto(`/profile/${bob}`);
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
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: `profile-7の親 ${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    const reply = `profile-7のリプライ ${Date.now()}`;
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: reply,
      reply: { root: parent, parent },
      createdAt: new Date().toISOString(),
    });
    await page.goto("/profile/alice.test?tab=replies");
    const main = page.getByRole("main");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(reply)).toBeVisible({ timeout: 1000 });
    }).toPass();

    await main.getByRole("tab", { name: "投稿" }).click();

    await expect(main.getByText(/^profile-7の親/).first()).toBeVisible();
    await expect(main.getByText(reply)).toHaveCount(0);
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
    await page.goto("/profile/alice.test");
    const main = page.getByRole("main");

    await main.getByRole("tab", { name: "いいね" }).click();

    await expect(page).toHaveURL("/profile/alice.test?tab=likes");
    await expect(async () => {
      await page.reload();
      await expect(main.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("profile-9: 他のユーザーのプロフィールには「いいね」タブを出さない", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await page.goto("/profile/bob.test");

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
    await page.goto("/profile/alice.test?tab=media");
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
    await page.goto(`/profile/${bob}`);
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

  test("profile-12: タイムラインとスレッドの投稿のアイコンか名前を選ぶと、右カラムに投稿者のプロフィールの簡易表示を開く", async ({
    page,
  }) => {
    const text = `profile-12の投稿 ${Date.now()}`;
    const { uri } = await createRecord("alice.test", "app.bsky.feed.post", {
      text,
      createdAt: new Date().toISOString(),
    });
    const panel = page.getByRole("region", { name: "プロフィール" });
    const article = page.getByRole("main").getByRole("article").filter({
      hasText: text,
    });
    await page.goto("/");
    await expect(async () => {
      await page.reload();
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();

    await article.locator('a[href*="profile="]').first().click();
    await expect(panel.getByText("@alice.test")).toBeVisible();

    await page.goto(`/?${new URLSearchParams({ thread: uri })}`);
    await page
      .getByRole("article", { name: "選んだ投稿" })
      .getByRole("link", { name: /@alice\.test/ })
      .click();
    await expect(panel.getByText("@alice.test")).toBeVisible();
  });
});
