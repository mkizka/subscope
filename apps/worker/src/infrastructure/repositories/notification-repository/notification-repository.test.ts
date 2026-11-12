import { schema } from "@repo/db";
import { accountFactory, recordFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { NotificationRepository } from "./notification-repository.js";

describe("NotificationRepository", () => {
  const { ctx } = testSetup;

  const notificationRepository = new NotificationRepository();

  describe("save", () => {
    test("通知を保存し、同じレコードと受信者の組み合わせは無視して、新しく保存した通知だけを返す", async () => {
      // arrange
      const author = await accountFactory(ctx.db).create();
      const recipient = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => author })
        .create();
      const notification = {
        recordUri: record.uri,
        recipientDid: recipient.did,
        authorDid: author.did,
        reasonSubject: null,
        sortAt: new Date(),
      };

      // act
      const created = await notificationRepository.save({
        ctx,
        notifications: [
          { ...notification, reason: "mention" },
          { ...notification, reason: "reply" },
        ],
      });
      const createdAgain = await notificationRepository.save({
        ctx,
        notifications: [{ ...notification, reason: "mention" }],
      });

      // assert
      const notifications = await ctx.db.select().from(schema.notifications);
      expect(notifications).toMatchObject([{ reason: "mention" }]);
      expect(created).toEqual([
        { recordUri: record.uri, recipientDid: recipient.did },
      ]);
      expect(createdAgain).toEqual([]);
    });
  });
});
