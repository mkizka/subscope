import getTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getTrackedActors", () => {
  const { ctx } = testSetup;

  const createActor = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createSubscriber = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .use((t) => t.subscriber())
      .create();

  type Actor = Awaited<ReturnType<typeof createActor>>;

  const follow = (follower: Actor, followee: Actor) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower })
            .create(),
        followee: () => followee,
      })
      .create();

  test("getTrackedActors-1: サブスクライバーとそのフォロイーを返し、それ以外のアクターは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const subscriber = await createSubscriber();
    const followee = await createActor();
    const other = await createActor();
    const otherFollowee = await createActor();
    await follow(subscriber, followee);
    await follow(other, otherFollowee);
    loginAs(subscriber.did);

    // act
    const res = await client.call(getTrackedActors);

    // assert
    expect(res.trackedActors.map((a) => a.profile.did).sort()).toEqual(
      [subscriber.did, followee.did].sort(),
    );
  });

  test("getTrackedActors-2: フォローしているサブスクライバーが多い順に並べる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const subscriber1 = await createSubscriber();
    const subscriber2 = await createSubscriber();
    const followedByOne = await createActor();
    const followedByTwo = await createActor();
    await follow(subscriber1, followedByOne);
    await follow(subscriber1, followedByTwo);
    await follow(subscriber2, followedByTwo);
    loginAs(subscriber1.did);

    // act
    const page1 = await client.call(getTrackedActors, { limit: 1 });
    const page2 = await client.call(getTrackedActors, {
      limit: 1,
      cursor: page1.cursor,
    });

    // assert
    expect([...page1.trackedActors, ...page2.trackedActors]).toMatchObject([
      { profile: { did: followedByTwo.did }, subscriberFollowersCount: 2 },
      { profile: { did: followedByOne.did }, subscriberFollowersCount: 1 },
    ]);
  });
});
