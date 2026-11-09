import { expect, test } from "@playwright/test";

test.describe("エラー", () => {
  test("error-e1: 存在しないページを開くと「ページが見つかりません」とステータスコード404を表示する", async ({
    page,
  }) => {
    await page.goto("/not-found-page");

    await expect(
      page.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeVisible();
    await expect(page.getByText("404", { exact: true })).toBeVisible();
  });
});
