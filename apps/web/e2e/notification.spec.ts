import { expect, test } from "@playwright/test";

import { login } from "./login";
import { createRecord, putRecord, resolveDid } from "./pds";

test.describe("通知", () => {
  test("notification-2: フォローされると、相手の名前が通知に出る", async ({
    page,
  }) => {
    const createdAt = new Date().toISOString();
    await putRecord("bob.test", "app.bsky.actor.profile", "self", {
      displayName: "Bob",
    });
    await createRecord("alice.test", "app.bsky.graph.follow", {
      subject: await resolveDid("bob.test"),
      createdAt,
    });
    await createRecord("bob.test", "app.bsky.graph.follow", {
      subject: await resolveDid("alice.test"),
      createdAt,
    });

    await login(page);

    await expect(async () => {
      await page.reload();
      await expect(
        page.getByText("Bobさんにフォローされました").first(),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
  });
});
