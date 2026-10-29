import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";
import { schema } from "@repo/db";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.notification.listNotifications", () => {
  const { ctx } = testSetup;

  test("listNotifications-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(listNotifications);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("listNotifications-2: 閲覧者宛ての通知を新しい順に返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const notify = async (sortAt: string) => {
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
      return record;
    };
    const read = await notify("2024-01-01T00:00:00.000Z");
    const unread = await notify("2024-01-03T00:00:00.000Z");
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));
    loginAs(viewer.did);

    // act
    const res = await client.call(listNotifications);

    // assert
    expect(res.notifications).toMatchObject([
      { uri: unread.uri, author: { did: author.did } },
      { uri: read.uri, author: { did: author.did } },
    ]);
  });

  test("listNotifications-3: 既読時刻以前の通知は既読にし、それより後の通知は未読にする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const notify = async (sortAt: string) => {
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
      return record;
    };
    const read = await notify("2024-01-01T00:00:00.000Z");
    const unread = await notify("2024-01-03T00:00:00.000Z");
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));
    loginAs(viewer.did);

    // act
    const res = await client.call(listNotifications);

    // assert
    expect(res.notifications).toMatchObject([
      { uri: unread.uri, isRead: false },
      { uri: read.uri, isRead: true },
    ]);
  });

  test("listNotifications-4: reasonsを指定すると、その種類の通知だけを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const notify = async (reason: "follow" | "like") => {
      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => author })
        .create();
      await ctx.db.insert(schema.notifications).values({
        recordUri: record.uri,
        recipientDid: viewer.did,
        authorDid: author.did,
        reason,
        sortAt: new Date(),
      });
      return record;
    };
    const follow = await notify("follow");
    await notify("like");
    loginAs(viewer.did);

    // act
    const res = await client.call(listNotifications, { reasons: ["follow"] });

    // assert
    expect(res.notifications).toMatchObject([
      { uri: follow.uri, reason: "follow" },
    ]);
  });

  test("listNotifications-5: seenAtに閲覧者の既読時刻を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));
    loginAs(viewer.did);

    // act
    const res = await client.call(listNotifications);

    // assert
    expect(res.seenAt).toBe("2024-01-02T00:00:00.000Z");
  });
});
