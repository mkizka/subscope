import { asAtIdentifierString } from "@atproto/syntax";
import getRegisteredFollowers from "@repo/client/lex/me/subsco/graph/getRegisteredFollowers";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.graph.getRegisteredFollowers", () => {
  const { ctx } = testSetup;

  const createAccount = () => accountFactory(ctx.db).create();

  const createRegisteredAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const follow = (follower: Account, followee: Account, date?: Date) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        followee: () => followee,
      })
      .props(date ? { createdAt: () => date, indexedAt: () => date } : {})
      .create();

  test("getRegisteredFollowers-1: 指定したアカウントをフォローしている登録アカウントだけをfollowersにprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    const registeredFollower = await createRegisteredAccount();
    const unregisteredFollower = await createAccount();
    await follow(registeredFollower, account);
    await follow(unregisteredFollower, account);

    // act
    const res = await client.call(getRegisteredFollowers, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.followers.map((a) => a.did)).toEqual([registeredFollower.did]);
  });

  test("getRegisteredFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    const oldFollower = await createRegisteredAccount();
    const middleFollower = await createRegisteredAccount();
    const newFollower = await createRegisteredAccount();
    await follow(oldFollower, account, new Date("2024-01-01"));
    await follow(middleFollower, account, new Date("2024-01-02"));
    await follow(newFollower, account, new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getRegisteredFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
    });
    const secondPage = await client.call(getRegisteredFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.followers.map((a) => a.did)).toEqual([
      newFollower.did,
      middleFollower.did,
    ]);
    expect(secondPage.followers.map((a) => a.did)).toEqual([oldFollower.did]);
  });

  test("getRegisteredFollowers-3: totalにはページングに関係なく登録アカウントのフォロワーの総数を入れる", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    await follow(await createRegisteredAccount(), account);
    await follow(await createRegisteredAccount(), account);
    await follow(await createAccount(), account);

    // act
    const res = await client.call(getRegisteredFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 1,
    });

    // assert
    expect(res.followers).toHaveLength(1);
    expect(res.total).toBe(2);
  });
});
