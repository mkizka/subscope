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

  test("getFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    const createFollow = async (date: Date) => {
      const other = await actorFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => other })
              .create(),
          followee: () => actor,
        })
        .props({ createdAt: () => date, indexedAt: () => date })
        .create();
      return other;
    };
    const oldActor = await createFollow(new Date("2024-01-01"));
    const middleActor = await createFollow(new Date("2024-01-02"));
    const newActor = await createFollow(new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getFollowers, {
      actor: asAtIdentifierString(actor.did),
      limit: 2,
    });
    const secondPage = await client.call(getFollowers, {
      actor: asAtIdentifierString(actor.did),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.followers.map((a) => a.did)).toEqual([
      newActor.did,
      middleActor.did,
    ]);
    expect(secondPage.followers.map((a) => a.did)).toEqual([oldActor.did]);
  });
});
