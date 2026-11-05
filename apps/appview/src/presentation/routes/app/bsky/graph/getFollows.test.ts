import { asAtIdentifierString } from "@atproto/syntax";
import getFollows from "@repo/client/app/bsky/graph/getFollows";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getFollows", () => {
  const { ctx } = testSetup;

  test("getFollows-1: 指定したアカウントをsubjectに、そのフォロー先をfollowsにprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const followee = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => account })
            .create(),
        followee: () => followee,
      })
      .create();

    // act
    const res = await client.call(getFollows, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res).toMatchObject({
      subject: { did: account.did },
      follows: [{ did: followee.did }],
    });
  });

  test("getFollows-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const createFollow = async (date: Date) => {
      const other = await accountFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ account: () => account })
              .create(),
          followee: () => other,
        })
        .props({ createdAt: () => date, indexedAt: () => date })
        .create();
      return other;
    };
    const oldAccount = await createFollow(new Date("2024-01-01"));
    const middleAccount = await createFollow(new Date("2024-01-02"));
    const newAccount = await createFollow(new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getFollows, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
    });
    const secondPage = await client.call(getFollows, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.follows.map((a) => a.did)).toEqual([
      newAccount.did,
      middleAccount.did,
    ]);
    expect(secondPage.follows.map((a) => a.did)).toEqual([oldAccount.did]);
  });
});
