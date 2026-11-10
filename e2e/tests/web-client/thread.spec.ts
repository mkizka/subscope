import { expect, type Page, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

const threadPath = (uri: string) => `/alice.test/post/${uri.split("/").pop()}`;

const post = (text: string, parent?: { uri: string; cid: string }) =>
  createRecord("alice.test", "app.bsky.feed.post", {
    text,
    reply: parent && { root: parent, parent },
    createdAt: new Date().toISOString(),
  });

const openThread = async (page: Page, uri: string, text: string) => {
  await page.goto("/");
  await page.waitForURL("/");
  await expect(async () => {
    await page.goto(threadPath(uri));
    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(text),
    ).toBeVisible({ timeout: 1000 });
  }).toPass();
};

test.describe("スレッド", () => {
  test("thread-e1: タイムラインや検索結果の投稿を選ぶと、その投稿のスレッドを開く", async ({
    page,
  }) => {
    const text = "thread-e1: 投稿";
    await post(text);

    await page.goto("/");
    const article = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.reload();
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();
    await article.getByRole("link", { name: "スレッドを開く" }).click();

    await expect(page).toHaveURL(/\/alice\.test\/post\/\w+$/);
    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(text),
    ).toBeVisible();
  });

  test("thread-e2: 親投稿はこのサーバーにあるところまでさかのぼって上に、直下の返信は下に並べる", async ({
    page,
  }) => {
    const grandparent = await post("thread-e2: 親の親");
    const parent = await post("thread-e2: 親", grandparent);
    const target = await post("thread-e2: 投稿", parent);
    await post("thread-e2: 返信", target);

    await openThread(page, target.uri, "thread-e2: 返信");

    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(/^thread-e2: /),
    ).toHaveText([
      "thread-e2: 親の親",
      "thread-e2: 親",
      "thread-e2: 投稿",
      "thread-e2: 返信",
    ]);
  });

  test("thread-e3: /ハンドル/post/rkey を開くと、その投稿のスレッドを表示する", async ({
    page,
  }) => {
    const text = "thread-e3: 投稿";
    const { uri } = await post(text);

    await openThread(page, uri, text);
  });

  test("thread-e4: 見出しの戻るボタンを押すと、スレッドを開く前の画面に戻る", async ({
    page,
  }) => {
    const text = "thread-e4: 投稿";
    await post(text);
    const search = `/search?${new URLSearchParams({ q: text })}`;
    const article = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.goto(search);
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();
    await article.getByRole("link", { name: "スレッドを開く" }).click();
    await page.getByRole("button", { name: "戻る" }).click();

    await expect(page).toHaveURL(search);
  });

  test("thread-e5: 直下の返信の下には、返信への返信を1件ずつたどって並べる", async ({
    page,
  }) => {
    const target = await post("thread-e5: 投稿");
    const reply = await post("thread-e5: 返信", target);
    const nested = await post("thread-e5: 返信の返信", reply);
    await post("thread-e5: 返信の返信の返信A", nested);
    await post("thread-e5: 返信の返信の返信B", nested);
    const region = page.getByRole("region", { name: "スレッド" });

    await page.goto("/");
    await page.waitForURL("/");
    await expect(async () => {
      await page.goto(threadPath(nested.uri));
      await expect(
        region.getByText(/^thread-e5: 返信の返信の返信/),
      ).toHaveCount(2, { timeout: 1000 });
    }).toPass();
    await page.goto(threadPath(target.uri));

    await expect(region.getByText(/^thread-e5: /)).toHaveText([
      "thread-e5: 投稿",
      "thread-e5: 返信",
      "thread-e5: 返信の返信",
      /^thread-e5: 返信の返信の返信[AB]$/,
    ]);
  });

  test.describe(() => {
    test.use({ timezoneId: "Pacific/Kiritimati" });

    test("thread-e6: 選んだ投稿の投稿日時は、ブラウザのタイムゾーンで表示する", async ({
      page,
    }) => {
      const text = "thread-e6: 投稿";
      const { uri } = await post(text);
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await openThread(page, uri, text);

      const time = page
        .getByRole("region", { name: "スレッド" })
        .getByRole("article", { name: "選んだ投稿" })
        .locator("time");
      const createdAt = (await time.getAttribute("datetime")) ?? "";
      await expect(time).toHaveText(
        new Date(createdAt).toLocaleString("ja-JP", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Pacific/Kiritimati",
        }),
      );
      expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
    });
  });

  test("thread-e7: スレッドで返信ボタンを押すと投稿欄が開き、投稿すると再読み込みなしでスレッドに返信を表示する", async ({
    page,
  }) => {
    const target = await post("thread-e7: 投稿");

    await openThread(page, target.uri, "thread-e7: 投稿");
    const thread = page.getByRole("region", { name: "スレッド" });
    await thread
      .getByRole("article", { name: "選んだ投稿" })
      .getByRole("button", { name: "返信" })
      .click();
    await page
      .getByRole("textbox", { name: "投稿内容" })
      .fill("thread-e7: 返信");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "返信", exact: true })
      .click();

    await expect(
      thread.getByRole("article").filter({ hasText: "thread-e7: 返信" }),
    ).toBeVisible();
  });

  test("thread-e8: スレッドから戻ると、スレッドを開く前のスクロール位置に戻る", async ({
    page,
  }) => {
    for (let i = 1; i <= 10; i++) {
      await post(`thread-e8: 投稿${i}`);
    }
    const article = page
      .getByRole("article")
      .filter({ hasText: "thread-e8: 投稿1" })
      .filter({ hasNotText: "thread-e8: 投稿10" });
    await page.goto("/");
    await expect(async () => {
      await page.reload();
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();
    await article.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    await article.getByRole("link", { name: "スレッドを開く" }).click();
    await expect(
      page
        .getByRole("region", { name: "スレッド" })
        .getByText("thread-e8: 投稿1"),
    ).toBeVisible();
    await page.getByRole("button", { name: "戻る" }).click();

    await expect(article).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
  });

  test("thread-e9: 選んだ投稿の直下に自分のアイコン付きの「返信を書く」欄を置き、押すとその投稿への返信の投稿欄を開く", async ({
    page,
  }) => {
    const target = await post("thread-e9: 投稿");

    await openThread(page, target.uri, "thread-e9: 投稿");
    const thread = page.getByRole("region", { name: "スレッド" });
    await thread.getByRole("button", { name: "返信を書く" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("article", { name: "返信先" })).toContainText(
      "thread-e9: 投稿",
    );
    await dialog
      .getByRole("textbox", { name: "投稿内容" })
      .fill("thread-e9: 返信");
    await dialog.getByRole("button", { name: "返信", exact: true }).click();

    await expect(
      thread.getByRole("article").filter({ hasText: "thread-e9: 返信" }),
    ).toBeVisible();
  });

  test("thread-e10: 選んだ投稿を削除すると、ホームに戻る", async ({ page }) => {
    const target = await post("thread-e10: 投稿");

    await openThread(page, target.uri, "thread-e10: 投稿");
    await page
      .getByRole("region", { name: "スレッド" })
      .getByRole("button", { name: "投稿のメニュー" })
      .click();
    await page.getByRole("button", { name: "削除" }).click();
    await page
      .getByRole("dialog", { name: "投稿を削除" })
      .getByRole("button", { name: "削除" })
      .click();

    await page.waitForURL("/");
    await expect(page.getByText("thread-e10: 投稿")).toHaveCount(0);
  });

  test("thread-e11: スレッドの親投稿や返信を選ぶと、その投稿のスレッドを開く", async ({
    page,
  }) => {
    const parent = await post("thread-e11: 親");
    const target = await post("thread-e11: 投稿", parent);
    await post("thread-e11: 返信", target);

    await openThread(page, target.uri, "thread-e11: 返信");
    const thread = page.getByRole("region", { name: "スレッド" });
    const focused = thread.getByRole("article", { name: "選んだ投稿" });
    for (const text of ["thread-e11: 親", "thread-e11: 返信"]) {
      await thread
        .getByRole("article")
        .filter({ hasText: text })
        .getByRole("link", { name: "スレッドを開く" })
        .click();
      await expect(focused).toContainText(text);
      await page.goBack();
      await expect(focused).toContainText("thread-e11: 投稿");
    }
  });

  test("thread-e12: 一度表示したスレッドに戻ると、読み込み直しを待たずに前回の内容を表示する", async ({
    page,
  }) => {
    const target = await post("thread-e12: 投稿");
    await openThread(page, target.uri, "thread-e12: 投稿");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "通知", exact: true })
      .click();
    await expect(page).toHaveURL("/notifications");
    await page.route("**/api/thread*", () => {});

    await page.goBack();

    await expect(
      page
        .getByRole("region", { name: "スレッド" })
        .getByText("thread-e12: 投稿"),
    ).toBeVisible();
  });

  test("thread-e13: 存在しない投稿のスレッドを開くと、再試行せずに「投稿が見つかりません」を表示する", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("**/api/thread*", async (route) => {
      requests++;
      await route.continue();
    });

    await page.goto("/alice.test/post/3zzzzzzzzzzzz");

    await expect(page.getByText("投稿が見つかりません")).toBeVisible();
    await page.waitForTimeout(3000);
    expect(requests).toBe(1);
  });

  test("thread-e14: スクロールしても見出しは画面上部に残り、投稿やツイートの埋め込みより手前に表示する", async ({
    page,
  }) => {
    const root = await post("thread-e14: 起点");
    for (let i = 0; i < 12; i++) {
      await post(`thread-e14: 返信${i}`, root);
    }
    await openThread(page, root.uri, "thread-e14: 返信11");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const header = page.getByRole("heading", { name: "スレッド" });
    await expect(header).toBeInViewport();
    const topmost = await header.evaluate((el) => {
      const { x, y } = el.getBoundingClientRect();
      return document.elementFromPoint(x + 1, y + 1)?.tagName;
    });
    expect(topmost).toBe("H1");
  });
});
