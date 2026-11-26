import { asAtIdentifierString } from "@atproto/syntax";
import getServerMemberFollowers from "@repo/client/me/subsco/graph/getServerMemberFollowers";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.graph.getServerMemberFollowers", () => {
  const { ctx } = testSetup;

  const createAccount = () => accountFactory(ctx.db).create();

  const createServerMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const follow = ({
    follower,
    followee,
    date,
  }: {
    follower: Account;
    followee: Account;
    date?: Date;
  }) =>
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

  test("getServerMemberFollowers-1: 指定したアカウントをフォローしているメンバーだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    const memberFollower = await createServerMember();
    const nonMemberFollower = await createAccount();
    await follow({ follower: memberFollower, followee: account });
    await follow({ follower: nonMemberFollower, followee: account });

    // act
    const res = await client.call(getServerMemberFollowers, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.followers.map((a) => a.did)).toEqual([memberFollower.did]);
  });

  test("getServerMemberFollowers-2: 新しくフォローした順に並べ、ページ送りする", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    const oldFollower = await createServerMember();
    const middleFollower = await createServerMember();
    const newFollower = await createServerMember();
    await follow({
      follower: oldFollower,
      followee: account,
      date: new Date("2024-01-01"),
    });
    await follow({
      follower: middleFollower,
      followee: account,
      date: new Date("2024-01-02"),
    });
    await follow({
      follower: newFollower,
      followee: account,
      date: new Date("2024-01-03"),
    });

    // act
    const firstPage = await client.call(getServerMemberFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 2,
    });
    const secondPage = await client.call(getServerMemberFollowers, {
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

  test("getServerMemberFollowers-3: totalにはページに関係なくメンバーのフォロワーの総数を入れる", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await createAccount();
    await follow({ follower: await createServerMember(), followee: account });
    await follow({ follower: await createServerMember(), followee: account });
    await follow({ follower: await createAccount(), followee: account });

    // act
    const res = await client.call(getServerMemberFollowers, {
      actor: asAtIdentifierString(account.did),
      limit: 1,
    });

    // assert
    expect(res.followers).toHaveLength(1);
    expect(res.total).toBe(2);
  });
});
