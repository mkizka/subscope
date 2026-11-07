import getFollowedAccounts from "@repo/client/me/subsco/server/getFollowedAccounts";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getFollowedAccounts", () => {
  const { ctx } = testSetup;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createServerMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .use((t) => t.serverMember())
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const follow = (follower: Account, followee: Account) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        followee: () => followee,
      })
      .create();

  test("getFollowedAccounts-1: メンバーの1人以上にフォローされているアカウントを返し、それ以外のアカウントは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const member = await createServerMember();
    const followedMember = await createServerMember();
    const followee = await createAccount();
    const other = await createAccount();
    const otherFollowee = await createAccount();
    await follow(member, followee);
    await follow(member, followedMember);
    await follow(other, otherFollowee);
    loginAs(member.did);

    // act
    const res = await client.call(getFollowedAccounts);

    // assert
    expect(res.followedAccounts.map((a) => a.profile.did).sort()).toEqual(
      [followee.did, followedMember.did].sort(),
    );
  });

  test("getFollowedAccounts-2: フォローしているメンバーが多い順に並べる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const serverMember1 = await createServerMember();
    const serverMember2 = await createServerMember();
    const followedByOne = await createAccount();
    const followedByTwo = await createAccount();
    await follow(serverMember1, followedByOne);
    await follow(serverMember1, followedByTwo);
    await follow(serverMember2, followedByTwo);
    loginAs(serverMember1.did);

    // act
    const page1 = await client.call(getFollowedAccounts, { limit: 1 });
    const page2 = await client.call(getFollowedAccounts, {
      limit: 1,
      cursor: page1.cursor,
    });

    // assert
    expect([
      ...page1.followedAccounts,
      ...page2.followedAccounts,
    ]).toMatchObject([
      { profile: { did: followedByTwo.did }, registeredFollowersCount: 2 },
      { profile: { did: followedByOne.did }, registeredFollowersCount: 1 },
    ]);
  });

  test("getFollowedAccounts-3: totalにはページングに関係なくフォローされているアカウントの総数を入れる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const serverMember = await createServerMember();
    await follow(serverMember, await createAccount());
    await follow(serverMember, await createAccount());
    loginAs(serverMember.did);

    // act
    const res = await client.call(getFollowedAccounts, { limit: 1 });

    // assert
    expect(res.followedAccounts).toHaveLength(1);
    expect(res.total).toBe(2);
  });

  test("getFollowedAccounts-4: qを指定すると、表示名またはハンドルにqを含むフォローされているアカウントだけを返す。totalはqに関係なく総数のままにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const serverMember = await createServerMember();
    const match = await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Needle Name" }))
      .create();
    await follow(serverMember, match);
    await follow(serverMember, await createAccount());
    loginAs(serverMember.did);

    // act
    const res = await client.call(getFollowedAccounts, { q: "needle" });

    // assert
    expect(res.followedAccounts.map((a) => a.profile.did)).toEqual([match.did]);
    expect(res.total).toBe(2);
  });
});
