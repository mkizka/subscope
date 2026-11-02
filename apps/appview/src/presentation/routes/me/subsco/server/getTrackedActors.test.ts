import getTrackedAccounts from "@repo/client/lex/me/subsco/server/getTrackedAccounts";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getTrackedAccounts", () => {
  const { ctx } = testSetup;

  const createActor = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createRegisteredAccount = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .use((t) => t.registeredAccount())
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

  test("getTrackedAccounts-1: サブスクライバーとそのフォロイーを返し、それ以外のアクターは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await createRegisteredAccount();
    const followee = await createActor();
    const other = await createActor();
    const otherFollowee = await createActor();
    await follow(registeredAccount, followee);
    await follow(other, otherFollowee);
    loginAs(registeredAccount.did);

    // act
    const res = await client.call(getTrackedAccounts);

    // assert
    expect(res.trackedAccounts.map((a) => a.profile.did).sort()).toEqual(
      [registeredAccount.did, followee.did].sort(),
    );
  });

  test("getTrackedAccounts-2: フォローしているサブスクライバーが多い順に並べる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount1 = await createRegisteredAccount();
    const registeredAccount2 = await createRegisteredAccount();
    const followedByOne = await createActor();
    const followedByTwo = await createActor();
    await follow(registeredAccount1, followedByOne);
    await follow(registeredAccount1, followedByTwo);
    await follow(registeredAccount2, followedByTwo);
    loginAs(registeredAccount1.did);

    // act
    const page1 = await client.call(getTrackedAccounts, { limit: 1 });
    const page2 = await client.call(getTrackedAccounts, {
      limit: 1,
      cursor: page1.cursor,
    });

    // assert
    expect([...page1.trackedAccounts, ...page2.trackedAccounts]).toMatchObject([
      { profile: { did: followedByTwo.did }, registeredFollowersCount: 2 },
      { profile: { did: followedByOne.did }, registeredFollowersCount: 1 },
    ]);
  });

  test("getTrackedAccounts-3: totalにはページングに関係なく追跡アクターの総数を入れる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await createRegisteredAccount();
    await follow(registeredAccount, await createActor());
    await follow(registeredAccount, await createActor());
    loginAs(registeredAccount.did);

    // act
    const res = await client.call(getTrackedAccounts, { limit: 1 });

    // assert
    expect(res.trackedAccounts).toHaveLength(1);
    expect(res.total).toBe(3);
  });
});
