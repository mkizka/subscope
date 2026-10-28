import { schema } from "@repo/db";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { NotificationRepository } from "./notification-repository.js";

describe("NotificationRepository", () => {
  const { ctx } = testSetup;

  const notificationRepository = new NotificationRepository();

  describe("createMany", () => {
    test("通知を保存し、同じレコードと受信者の組み合わせは無視する", async () => {
      // arrange
      const author = await actorFactory(ctx.db).create();
      const recipient = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => author })
        .create();
      const notification = {
        recordUri: record.uri,
        recipientDid: recipient.did,
        authorDid: author.did,
        reasonSubject: null,
        sortAt: new Date(),
      };

      // act
      await notificationRepository.createMany({
        ctx,
        notifications: [
          { ...notification, reason: "mention" },
          { ...notification, reason: "reply" },
        ],
      });

      // assert
      const notifications = await ctx.db.select().from(schema.notifications);
      expect(notifications).toMatchObject([{ reason: "mention" }]);
    });
  });
});
