import { expect, type Page, test } from "@playwright/test";

const IN_PROGRESS = "過去の投稿を取り込んでいます";
const ERROR = "一部のユーザーの過去の投稿を取り込めていません";
const DONE = "過去の投稿の取り込みが終わりました";

const mockBackfillStatus = async (
  page: Page,
  statuses: { inProgress: number; error: number }[],
) => {
  await page.route("**/api/backfill-status", async (route) => {
    await route.fulfill({ json: statuses.shift() ?? statuses.at(-1) });
  });
};

test.describe("過去の投稿の取り込み状態", () => {
  test("backfillBanner-1: 取り込み中の人がいる間は、「過去の投稿を取り込んでいます」の帯を出す", async ({
    page,
  }) => {
    await mockBackfillStatus(page, [{ inProgress: 2, error: 0 }]);

    await page.goto("/");

    await expect(page.getByText(IN_PROGRESS)).toBeVisible();
  });

  test("backfillBanner-2: 取り込みエラーの人がいれば、取り込み中の人がいても「一部のユーザーの過去の投稿を取り込めていません」の帯を出す", async ({
    page,
  }) => {
    await mockBackfillStatus(page, [{ inProgress: 2, error: 1 }]);

    await page.goto("/");

    await expect(page.getByText(ERROR)).toBeVisible();
    await expect(page.getByText(IN_PROGRESS)).toHaveCount(0);
  });

  test("backfillBanner-3: 全員の取り込みが終わっていれば、帯を出さない", async ({
    page,
    request,
  }) => {
    await expect(async () => {
      const response = await request.get("/api/backfill-status");
      expect(await response.json()).toEqual({ inProgress: 0, error: 0 });
    }).toPass();

    const statusResponse = page.waitForResponse("**/api/backfill-status");
    await page.goto("/");
    await statusResponse;

    await expect(
      page.getByRole("heading", { name: "フォロー中" }),
    ).toBeVisible();
    await expect(page.getByText(IN_PROGRESS)).toHaveCount(0);
    await expect(page.getByText(ERROR)).toHaveCount(0);
    await expect(page.getByText(DONE)).toHaveCount(0);
  });

  test("backfillBanner-4: 取り込み中かエラーの間は30秒ごとに状態を確認し直し、全員の取り込みが終わったら「過去の投稿の取り込みが終わりました」の帯と「更新する」ボタンを出す", async ({
    page,
  }) => {
    await page.clock.install();
    await mockBackfillStatus(page, [
      { inProgress: 1, error: 0 },
      { inProgress: 0, error: 1 },
      { inProgress: 0, error: 0 },
    ]);

    await page.goto("/");
    await expect(page.getByText(IN_PROGRESS)).toBeVisible();

    await page.clock.fastForward(29_000);
    await expect(page.getByText(IN_PROGRESS)).toBeVisible();
    await page.clock.fastForward(1_000);
    await expect(page.getByText(ERROR)).toBeVisible();

    await page.clock.fastForward(30_000);
    await expect(page.getByText(DONE)).toBeVisible();
    await expect(page.getByRole("button", { name: "更新する" })).toBeVisible();
  });

  test("backfillBanner-5: 「更新する」を押すと、タイムラインを読み込み直して帯を消す", async ({
    page,
  }) => {
    await page.clock.install();
    await mockBackfillStatus(page, [
      { inProgress: 1, error: 0 },
      { inProgress: 0, error: 0 },
    ]);
    await page.goto("/");
    await expect(page.getByText(IN_PROGRESS)).toBeVisible();
    await page.clock.fastForward(30_000);

    const timelineResponse = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith(".data"),
    );
    await page.getByRole("button", { name: "更新する" }).click();
    await timelineResponse;

    await expect(page.getByText(DONE)).toHaveCount(0);
  });
});
