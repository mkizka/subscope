import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord, putRecord, resolveHandle } from "./pds";

test.describe("通知", () => {
  test("notification-5: 未読の通知は背景色で区別され、通知を開いた後に再表示すると既読になる", async ({
    page,
  }) => {
    await login(page);
    const [aliceDid, bobDid] = await Promise.all([
      resolveHandle("alice.test"),
      resolveHandle("bob.test"),
    ]);
    const createdAt = new Date().toISOString();
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: bobDid,
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: aliceDid,
      createdAt,
    });

    const notification = page
      .getByRole("region", { name: "通知" })
      .getByRole("listitem")
      .first();
    await expect(async () => {
      await page.reload();
      await expect(notification).toHaveText("Bob", { timeout: 1000 });
      await expect(notification).toHaveClass(/bg-base-200/, { timeout: 1000 });
    }).toPass();

    await page.reload();
    await expect(notification).not.toHaveClass(/bg-base-200/);
  });
});
