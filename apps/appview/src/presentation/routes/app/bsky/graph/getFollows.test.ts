import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getFollows", () => {
  const { ctx } = testSetup;

  test("getFollows-1: フォローしているアクターを指定した場合、そのアクターをsubject、フォロー先のprofileViewをfollowsとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const followee = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followee,
      })
      .create();

    // act
    const res = await client.app.bsky.graph.getFollows({ actor: actor.did });

    // assert
    expect(res.data).toMatchObject({
      subject: { did: actor.did },
      follows: [{ did: followee.did }],
    });
  });
});
