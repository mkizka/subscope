import { type APIRequestContext, expect, test } from "@playwright/test";

import { createRecord, follow, PDS_URL, putRecord } from "../../helpers/pds";

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
  test("timeline-e1: 自分とフォロー先の投稿を、新しいものほど上に並べる", async ({
    page,
    request,
  }) => {
    const texts = ["timeline-e1: 古い投稿", "timeline-e1: 新しい投稿"];
    await createPosts(request, texts);
    texts.reverse();

    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-e1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("timeline-e3: 一番下の2画面分手前までスクロールすると、続きの古い投稿を読み込む", async ({
    page,
    request,
  }) => {
    const texts = Array.from(
      { length: 55 },
      (_, i) => `timeline-e3: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    const oldestPost = page.getByText("timeline-e3: 投稿1", { exact: true });
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-e3: 投稿55")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(oldestPost).toHaveCount(0);

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight - window.innerHeight * 2.5),
    );

    await expect(oldestPost).toBeAttached();
  });

  test("timeline-e6: 投稿は1回に50件ずつ読み込む", async ({
    page,
    request,
  }) => {
    const texts = Array.from(
      { length: 55 },
      (_, i) => `timeline-e6: 投稿${i + 1}`,
    );
    await createPosts(request, texts);

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-e6: 投稿55")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    await expect(
      page.getByText("timeline-e6: 投稿6", { exact: true }),
    ).toBeAttached();
    await expect(
      page.getByText("timeline-e6: 投稿5", { exact: true }),
    ).toHaveCount(0);
  });

  test("timeline-e7: 一度表示したタイムラインに戻ると、読み込み直しを待たずに前回の投稿を表示する", async ({
    page,
    request,
  }) => {
    const text = `timeline-e7: ${Date.now()}`;
    await createPosts(request, [text]);
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText(text)).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "通知", exact: true })
      .click();
    await expect(page).toHaveURL("/notifications");
    await page.route("**/api/timeline*", () => {});

    await page.goBack();

    await expect(page.getByText(text)).toBeVisible();
  });

  test("timeline-e8: 表示中は60秒ごとに投稿を自動で読み込み直し、読み込み中は一覧の上部に、スピナー付きの「更新中」の表示を投稿の上、上部のタブの下に重ねて浮かせ、スクロールしても画面上の位置を変えない", async ({
    page,
    request,
  }) => {
    await createPosts(request, [`timeline-e8: ${Date.now()}`]);
    await page.clock.install();
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-e8:")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    const spinner = page.getByRole("status", { name: "タイムラインを更新中" });
    await expect(spinner).toBeHidden();
    let release: (v: unknown) => void = () => {};
    const gate = new Promise((resolve) => (release = resolve));
    await page.route("**/api/timeline*", async (route) => {
      await gate;
      await route.continue();
    });
    const newText = `timeline-e8-new: ${Date.now()}`;
    await createPosts(request, [newText]);

    await page.clock.fastForward(60_000);

    await expect(spinner).toBeVisible();
    const isOnTop = await spinner.evaluate((el) => {
      if (el.parentElement) el.parentElement.style.pointerEvents = "auto";
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
      );
      return el.contains(hit);
    });
    expect(isOnTop).toBe(true);
    await page.addStyleTag({ content: "main { min-height: 3000px }" });
    const topBefore = (await spinner.boundingBox())?.y;
    await page.mouse.wheel(0, 300);
    await expect(async () => {
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    }).toPass();
    expect((await spinner.boundingBox())?.y).toBe(topBefore);
    release(undefined);
    await expect(spinner).toBeHidden();
    await expect(async () => {
      await page.clock.fastForward(60_000);
      await expect(page.getByText(newText)).toBeVisible({ timeout: 1000 });
    }).toPass();
  });

  test("timeline-e9: 表示中のタイムラインと同じものを指すメニューのホーム、またはフォロー中・ローカルのタブをタップすると、先頭へスクロールして投稿を読み込み直し、読み込み中は timeline-e8 と同じ「更新中」の表示を出す", async ({
    page,
    request,
  }) => {
    await createPosts(request, [`timeline-e9: ${Date.now()}`]);
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("timeline-e9:")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    const spinner = page.getByRole("status", { name: "タイムラインを更新中" });
    await expect(spinner).toBeHidden();
    let release: (v: unknown) => void = () => {};
    const gate = new Promise((resolve) => (release = resolve));
    await page.route("**/api/timeline*", async (route) => {
      await gate;
      await route.continue();
    });

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "ホーム" })
      .click();

    await expect(spinner).toBeVisible();
    release(undefined);
    await expect(spinner).toBeHidden();

    await page.unroute("**/api/timeline*");
    await page.getByRole("tab", { name: "フォロー中" }).click();
    await expect(page).toHaveURL("/");
  });

  test("timeline-e4: 投稿の時刻は、ブラウザの現在時刻からの経過時間で表示する", async ({
    page,
    request,
  }) => {
    const text = "timeline-e4: 投稿";
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

  test("timeline-e2: 返信先かスレッドの起点が他人の投稿であるリプライは含めず、親投稿に返信の件数を表示する", async ({
    page,
  }) => {
    await follow("alice.test", "bob.test");
    await putRecord("alice.test", "app.bsky.actor.profile", "self", {});
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-e2: 親投稿",
      createdAt: new Date().toISOString(),
    });
    await createRecord("bob.test", "app.bsky.feed.post", {
      text: "timeline-e2: 返信",
      reply: { root: parent, parent },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");

    const parentPost = page
      .getByRole("article")
      .filter({ hasText: "timeline-e2: 親投稿" });
    await expect(async () => {
      await page.reload();
      await expect(parentPost.getByTitle("1件の返信")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(page.getByText("timeline-e2: 返信")).toHaveCount(0);
  });

  test("timeline-e5: 返信先とスレッドの起点がどちらも投稿者自身の投稿であるリプライは含める", async ({
    page,
  }) => {
    const root = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-e5: 起点",
      createdAt: new Date().toISOString(),
    });
    const parent = await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-e5: 1つ目の返信",
      reply: { root, parent: root },
      createdAt: new Date().toISOString(),
    });
    await createRecord("alice.test", "app.bsky.feed.post", {
      text: "timeline-e5: 2つ目の返信",
      reply: { root, parent },
      createdAt: new Date().toISOString(),
    });

    await page.goto("/");

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^timeline-e5: /)).toHaveCount(3, {
        timeout: 1000,
      });
    }).toPass();
  });
});

test.describe("ローカルタイムライン", () => {
  test("localTimeline-e1: 「ローカル」タブを選ぶと、このサーバーのメンバーの投稿を新しいものほど上に表示する", async ({
    page,
    request,
  }) => {
    const texts = [
      "localTimeline-e1: 古い投稿",
      "localTimeline-e1: 新しい投稿",
    ];
    await createPosts(request, texts);
    texts.reverse();

    await page.goto("/");
    await page.getByRole("tab", { name: "ローカル" }).click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/^localTimeline-e1: /)).toHaveText(texts, {
        timeout: 1000,
      });
    }).toPass();
  });

  test("localTimeline-e2: 「ローカル」タブには、メンバーのフォロー先であってもメンバーではないアカウントの投稿は表示しない", async ({
    page,
    request,
  }) => {
    await follow("alice.test", "heidi.test");
    await createRecord("heidi.test", "app.bsky.feed.post", {
      text: "localTimeline-e2: メンバーではない人の投稿",
      createdAt: new Date().toISOString(),
    });
    await createPosts(request, ["localTimeline-e2: メンバーの投稿"]);

    await page.goto("/?tab=local");

    await expect(async () => {
      await page.reload();
      await expect(
        page.getByText("localTimeline-e2: メンバーの投稿"),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(
      page.getByText("localTimeline-e2: メンバーではない人の投稿"),
    ).toBeHidden();
  });

  test("localTimeline-e3: 「フォロー中」タブを選ぶと、フォロー中のタイムラインに戻る", async ({
    page,
    request,
  }) => {
    await createPosts(request, ["localTimeline-e3: 投稿"]);

    await page.goto("/?tab=local");
    await page.getByRole("tab", { name: "フォロー中" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("tab", { name: "フォロー中" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
