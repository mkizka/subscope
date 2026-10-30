import { asDid } from "@atproto/did";
import banSubscriber from "@repo/client/lex/me/subsco/admin/banSubscriber";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.banSubscriber", () => {
  const { ctx } = testSetup;

  test("banSubscriber-1: 管理者はBANせず、400とCannotBanAdminを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .use((t) => t.subscriber())
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(banSubscriber, { did: asDid(admin.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "CannotBanAdmin",
    });
  });

  test("banSubscriber-2: 本人とそのフォロイーのsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
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
    loginAs(admin.did);

    // act
    await client.call(banSubscriber, { did: asDid(subscriber.did) });

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([
      { did: asDid(subscriber.did) },
      { did: followee.did },
    ]);
  });
});
