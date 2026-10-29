import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";
import { schema } from "@repo/db";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.notification.getUnreadCount", () => {
  const { ctx } = testSetup;

  test("getUnreadCount-1: 認証がない場合、401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getUnreadCount);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getUnreadCount-2: 閲覧者宛ての通知のうち、既読時刻より新しい通知の数を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db).create();
    for (const sortAt of ["2024-01-01", "2024-01-03", "2024-01-04"]) {
      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => author })
        .create();
      await ctx.db.insert(schema.notifications).values({
        recordUri: record.uri,
        recipientDid: viewer.did,
        authorDid: author.did,
        reason: "follow",
        sortAt: new Date(sortAt),
      });
    }
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-02") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));
    loginAs(viewer.did);

    // act
    const res = await client.call(getUnreadCount);

    // assert
    expect(res).toEqual({ count: 2 });
  });

  test("getUnreadCount-3: seenAtを指定した場合、保存済みの既読時刻ではなくseenAtより新しい通知の数を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db).create();
    for (const sortAt of ["2024-01-01", "2024-01-03", "2024-01-04"]) {
      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => author })
        .create();
      await ctx.db.insert(schema.notifications).values({
        recordUri: record.uri,
        recipientDid: viewer.did,
        authorDid: author.did,
        reason: "follow",
        sortAt: new Date(sortAt),
      });
    }
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-02") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));
    loginAs(viewer.did);

    // act
    const res = await client.call(getUnreadCount, {
      seenAt: "2024-01-03T12:00:00.000Z",
    });

    // assert
    expect(res).toEqual({ count: 1 });
  });
});
