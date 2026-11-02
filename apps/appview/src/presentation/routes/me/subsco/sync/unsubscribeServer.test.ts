import unsubscribeServer from "@repo/client/lex/me/subsco/sync/unsubscribeServer";
import { schema } from "@repo/db";
import {
  actorFactory,
  followFactory,
  inviteCodeFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.unsubscribeServer", () => {
  const { ctx } = testSetup;

  test("unsubscribeServer-1: 本人とそのフォロイーのsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => subscriber })
            .create(),
        followee: () => followee,
      })
      .create();
    loginAs(subscriber.did);

    // act
    await client.call(unsubscribeServer);

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([
      { did: subscriber.did },
      { did: followee.did },
    ]);
  });

  test("unsubscribeServer-2: 登録を消し、使った招待コードは使用済みのまま残す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const usedAt = new Date("2025-01-01T00:00:00.000Z");
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({ usedAt: () => usedAt })
      .create();
    const subscription = await subscriptionFactory(ctx.db)
      .vars({ inviteCode: () => inviteCode })
      .create();
    loginAs(subscription.actorDid);

    // act
    await client.call(unsubscribeServer);

    // assert
    const subscriptions = await ctx.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.actorDid, subscription.actorDid));
    expect(subscriptions).toEqual([]);
    const [savedInviteCode] = await ctx.db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, inviteCode.code));
    expect(savedInviteCode?.usedAt).toEqual(usedAt);
  });

  test("unsubscribeServer-3: 登録していなければ400とNotSubscribedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    const promise = client.call(unsubscribeServer);

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotSubscribed",
    });
  });
});
