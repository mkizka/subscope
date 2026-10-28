import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { NotificationRepository } from "./notification-repository.js";

describe("NotificationRepository", () => {
  const { ctx } = testSetup;

  const notificationRepository = new NotificationRepository(ctx.db);

  describe("findMany", () => {
    test("受信者の通知をcursorより古いものから新しい順に返し、seenAt以前のものを既読にする", async () => {
      // arrange
      const recipient = await actorFactory(ctx.db)
        .use((t) => t.subscriber())
        .create();
      const author = await actorFactory(ctx.db).create();
      const notify = async (sortAt: string) => {
        const record = await recordFactory(ctx.db, "app.bsky.feed.like")
          .vars({ actor: () => author })
          .create();
        await ctx.db.insert(schema.notifications).values({
          recordUri: record.uri,
          recipientDid: recipient.did,
          authorDid: author.did,
          reason: "like",
          sortAt: new Date(sortAt),
        });
        return record;
      };
      const read = await notify("2024-01-01T00:00:00.000Z");
      const unread = await notify("2024-01-03T00:00:00.000Z");
      await notify("2024-01-05T00:00:00.000Z");
      await ctx.db
        .update(schema.subscriptions)
        .set({ seenAt: new Date("2024-01-02T00:00:00.000Z") })
        .where(eq(schema.subscriptions.actorDid, recipient.did));

      // act
      const result = await notificationRepository.findMany({
        recipientDid: asDid(recipient.did),
        limit: 10,
        cursor: new Date("2024-01-04T00:00:00.000Z"),
      });

      // assert
      expect(result).toMatchObject([
        { recordUri: unread.uri, cid: unread.cid, isRead: false },
        { recordUri: read.uri, cid: read.cid, isRead: true },
      ]);
    });
  });

  describe("countUnread", () => {
    test("受信者の通知のうちseenAtより新しいものの数を返す", async () => {
      // arrange
      const recipient = await actorFactory(ctx.db)
        .use((t) => t.subscriber())
        .create();
      const author = await actorFactory(ctx.db).create();
      for (const sortAt of ["2024-01-01", "2024-01-03", "2024-01-05"]) {
        const record = await recordFactory(ctx.db, "app.bsky.feed.like")
          .vars({ actor: () => author })
          .create();
        await ctx.db.insert(schema.notifications).values({
          recordUri: record.uri,
          recipientDid: recipient.did,
          authorDid: author.did,
          reason: "like",
          sortAt: new Date(sortAt),
        });
      }
      await ctx.db
        .update(schema.subscriptions)
        .set({ seenAt: new Date("2024-01-02") })
        .where(eq(schema.subscriptions.actorDid, recipient.did));

      // act
      const result = await notificationRepository.countUnread(
        asDid(recipient.did),
      );

      // assert
      expect(result).toBe(2);
    });
  });
});
