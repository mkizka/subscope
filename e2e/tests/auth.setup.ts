import { test as setup } from "@playwright/test";

import { login } from "../helpers/login";

setup("aliceでログインする", async ({ page }) => {
  await login(page);
  await page.context().storageState({ path: ".auth/alice.json" });
});
