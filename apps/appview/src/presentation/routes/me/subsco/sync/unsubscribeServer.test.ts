import unsubscribeServer from "@repo/client/lex/me/subsco/sync/unsubscribeServer";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
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
});
