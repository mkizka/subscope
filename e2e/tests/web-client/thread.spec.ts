import { expect, type Page, test } from "@playwright/test";

import { createRecord } from "../../helpers/pds";

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
    await page.goto(`/?${new URLSearchParams({ thread: uri })}`);
    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(text),
    ).toBeVisible({ timeout: 1000 });
  }).toPass();
};

test.describe("スレッド", () => {
  test("thread-1: タイムラインの投稿を選ぶと、右カラムにその投稿のスレッドを開く", async ({
    page,
  }) => {
    const text = "thread-1: 投稿";
    await post(text);

    await page.goto("/");
    const article = page.getByRole("article").filter({ hasText: text });
    await expect(async () => {
      await page.reload();
      await expect(article).toBeVisible({ timeout: 1000 });
    }).toPass();
    await article.getByRole("link", { name: "スレッドを開く" }).click();

    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(text),
    ).toBeVisible();
  });

  test("thread-2: 親投稿はこのサーバーにあるところまでさかのぼって上に、直下の返信は下に並べる", async ({
    page,
  }) => {
    const grandparent = await post("thread-2: 親の親");
    const parent = await post("thread-2: 親", grandparent);
    const target = await post("thread-2: 投稿", parent);
    await post("thread-2: 返信", target);

    await openThread(page, target.uri, "thread-2: 返信");

    await expect(
      page.getByRole("region", { name: "スレッド" }).getByText(/^thread-2: /),
    ).toHaveText([
      "thread-2: 親の親",
      "thread-2: 親",
      "thread-2: 投稿",
      "thread-2: 返信",
    ]);
  });

  test("thread-3: URLに ?thread=投稿のAT URI があると、右カラムにその投稿のスレッドを開く", async ({
    page,
  }) => {
    const text = "thread-3: 投稿";
    const { uri } = await post(text);

    await openThread(page, uri, text);
  });

  test("thread-4: スレッドを閉じると、右カラムを通知に戻す", async ({
    page,
  }) => {
    const text = "thread-4: 投稿";
    const { uri } = await post(text);

    await openThread(page, uri, text);
    await page.getByRole("link", { name: "閉じる" }).click();

    await expect(page.getByRole("heading", { name: "通知" })).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("thread-5: 選んだ投稿は本文を大きくし、投稿日時と返信・リポスト・いいねの件数を表示する", async ({
    page,
  }) => {
    const target = await post("thread-5: 投稿");
    await post("thread-5: 返信", target);
    await createRecord("alice.test", "app.bsky.feed.like", {
      subject: target,
      createdAt: new Date().toISOString(),
    });

    await openThread(page, target.uri, "thread-5: 返信");

    const focused = page
      .getByRole("region", { name: "スレッド" })
      .getByRole("article", { name: "選んだ投稿" });
    await expect(focused.getByText("thread-5: 投稿")).toHaveCSS(
      "font-size",
      "18px",
    );
    await expect(focused.locator("time")).toHaveText(
      /\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}/,
    );
    await expect(async () => {
      await page.reload();
      await expect(focused.getByText("1件の返信")).toBeVisible({
        timeout: 1000,
      });
      await expect(focused.getByText("1件のいいね")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });

  test.describe(() => {
    test.use({ timezoneId: "Pacific/Kiritimati" });

    test("thread-7: 選んだ投稿の投稿日時は、ブラウザのタイムゾーンで表示する", async ({
      page,
    }) => {
      const text = "thread-7: 投稿";
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
});
