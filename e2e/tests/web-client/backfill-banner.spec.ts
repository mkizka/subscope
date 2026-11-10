import { expect, type Page, test } from "@playwright/test";

const IN_PROGRESS = "過去の投稿を同期しています";
const ERROR = "過去の投稿を同期できていません";
const DONE = "過去の投稿の同期が終わりました";

const mockBackfillStatus = async (
  page: Page,
  statuses: ("inProgress" | "completed" | "error")[],
) => {
  await page.route("**/api/backfill-status", async (route) => {
    await route.fulfill({
      json: { status: statuses.shift() ?? statuses.at(-1) },
    });
  });
};

test.describe("過去の投稿の同期状態", () => {
  test("backfillBanner-e1: 同期中かエラーの間は30秒ごとに状態を確認し直し、同期が終わったら「過去の投稿の同期が終わりました」の帯と「更新する」ボタンを出す", async ({
    page,
  }) => {
    await page.clock.install();
    await mockBackfillStatus(page, ["inProgress", "error", "completed"]);

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

  test("backfillBanner-e2: 「更新する」を押すと、タイムラインを読み込み直して帯を消す", async ({
    page,
  }) => {
    await page.clock.install();
    await mockBackfillStatus(page, ["inProgress", "completed"]);
    await page.goto("/");
    await expect(page.getByText(IN_PROGRESS)).toBeVisible();
    await page.clock.fastForward(30_000);

    const timelineResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/timeline",
    );
    await page.getByRole("button", { name: "更新する" }).click();
    await timelineResponse;

    await expect(page.getByText(DONE)).toHaveCount(0);
  });
});
