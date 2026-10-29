import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getFollowers", () => {
  const { ctx } = testSetup;

  test("getFollowers-1: フォロワーがいるアクターを指定した場合、そのアクターをsubject、フォロワーのprofileViewをfollowersとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const follower = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower })
            .create(),
        followee: () => actor,
      })
      .create();

    // act
    const res = await client.app.bsky.graph.getFollowers({ actor: actor.did });

    // assert
    expect(res.data).toMatchObject({
      subject: { did: actor.did },
      followers: [{ did: follower.did }],
    });
  });
});
