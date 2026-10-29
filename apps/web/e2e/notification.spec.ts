import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord, resolveHandle } from "./pds";

test.describe("通知", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("notification-6: モバイルでは、未読があるときヘッダーの🔔に未読数が出る", async ({
    page,
  }) => {
    const createdAt = new Date().toISOString();
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: await resolveHandle("bob.test"),
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: await resolveHandle("alice.test"),
      createdAt,
    });

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(page.getByLabel("通知を開く")).toHaveText(/^\d+$/, {
        timeout: 1000,
      });
    }).toPass();
  });
});
