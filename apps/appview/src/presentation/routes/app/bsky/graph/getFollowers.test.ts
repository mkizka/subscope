import { asAtIdentifierString } from "@atproto/syntax";
import getFollowers from "@repo/client/app/bsky/graph/getFollowers";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getFollowers", () => {
  const { ctx } = testSetup;

  test("getFollowers-1: 指定したアカウントをsubjectに、そのフォロワーをfollowersにprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const follower = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        followee: () => account,
      })
      .create();

    // act
    const res = await client.call(getFollowers, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res).toMatchObject({
      subject: { did: account.did },
      followers: [{ did: follower.did }],
    });
  });

  test("getFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const createFollow = async (date: Date) => {
      const other = await accountFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ account: () => other })
              .create(),
          followee: () => account,
        })
        .props({ createdAt: () => date, indexedAt: () => date })
        .create();
      return other;
    };
    const oldAccount = await createFollow(new Date("2024-01-01"));
    const middleAccount = await createFollow(new Date("2024-01-02"));
    const newAccount = await createFollow(new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
    });
    const secondPage = await client.call(getFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.followers.map((a) => a.did)).toEqual([
      newAccount.did,
      middleAccount.did,
    ]);
    expect(secondPage.followers.map((a) => a.did)).toEqual([oldAccount.did]);
  });
});
