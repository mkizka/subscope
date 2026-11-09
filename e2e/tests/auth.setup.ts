import { expect, test as setup } from "@playwright/test";

import { login } from "../helpers/login";

setup("aliceでログインする", async ({ page }) => {
  setup.setTimeout(120_000);
  await login(page);
  await expect(async () => {
    const response = await page.request.get("/api/backfill-status");
    expect(await response.json()).toEqual({ status: "completed" });
  }).toPass({ timeout: 100_000 });
  await page.context().storageState({ path: ".auth/alice.json" });
});
