import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const index: {
  entries: Record<string, { id: string; importPath: string; tags: string[] }>;
} = JSON.parse(
  readFileSync("../apps/web/storybook-static/index.json", "utf-8"),
);

const storyIds = Object.values(index.entries)
  .filter(
    (entry) =>
      entry.importPath.includes("/pages/") && !entry.tags.includes("play"),
  )
  .map((entry) => entry.id);

for (const id of storyIds) {
  test(id, async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-01-01T00:00:00Z"));
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await page.locator("body.sb-show-main").waitFor();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${id}.png`, { fullPage: true });
  });
}
