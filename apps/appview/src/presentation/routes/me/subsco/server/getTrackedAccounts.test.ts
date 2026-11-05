import getTrackedAccounts from "@repo/client/me/subsco/server/getTrackedAccounts";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getTrackedAccounts", () => {
  const { ctx } = testSetup;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createRegisteredAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .use((t) => t.registeredAccount())
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

  test("getTrackedAccounts-1: 登録アカウントとそのフォロー先を返し、それ以外のアカウントは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await createRegisteredAccount();
    const followee = await createAccount();
    const other = await createAccount();
    const otherFollowee = await createAccount();
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

  test("getTrackedAccounts-2: フォローしている登録アカウントが多い順に並べる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount1 = await createRegisteredAccount();
    const registeredAccount2 = await createRegisteredAccount();
    const followedByOne = await createAccount();
    const followedByTwo = await createAccount();
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

  test("getTrackedAccounts-3: totalにはページングに関係なく追跡アカウントの総数を入れる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await createRegisteredAccount();
    await follow(registeredAccount, await createAccount());
    await follow(registeredAccount, await createAccount());
    loginAs(registeredAccount.did);

    // act
    const res = await client.call(getTrackedAccounts, { limit: 1 });

    // assert
    expect(res.trackedAccounts).toHaveLength(1);
    expect(res.total).toBe(3);
  });

  test("getTrackedAccounts-4: qを指定すると、表示名またはハンドルにqを含む追跡アカウントだけを返す。totalはqに関係なく総数のままにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await createRegisteredAccount();
    const match = await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Needle Name" }))
      .create();
    await follow(registeredAccount, match);
    await follow(registeredAccount, await createAccount());
    loginAs(registeredAccount.did);

    // act
    const res = await client.call(getTrackedAccounts, { q: "needle" });

    // assert
    expect(res.trackedAccounts.map((a) => a.profile.did)).toEqual([match.did]);
    expect(res.total).toBe(3);
  });
});
