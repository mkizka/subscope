import { expect, test } from "@playwright/test";

test.describe("エラー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/not-found-page");
  });

  test("error-1: 存在しないページを開くと「ページが見つかりません」とステータスコード404を表示する", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeVisible();
    await expect(page.getByText("404", { exact: true })).toBeVisible();
  });

  test("error-2: 「ホームに戻る」を押すとトップページに移動する", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "ホームに戻る" }).click();

    await expect(page).toHaveURL("/");
  });
});
