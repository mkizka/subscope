import { asAtIdentifierString } from "@atproto/syntax";
import getFollowers from "@repo/client/lex/app/bsky/graph/getFollowers";
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

  test("getFollowers-1: 指定したアクターをsubjectに、そのフォロワーをfollowersにprofileViewで返す", async () => {
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
    const res = await client.call(getFollowers, {
      actor: asAtIdentifierString(actor.did),
    });

    // assert
    expect(res).toMatchObject({
      subject: { did: actor.did },
      followers: [{ did: follower.did }],
    });
  });
});
