import { asAtIdentifierString } from "@atproto/syntax";
import getKnownFollowers from "@repo/client/app/bsky/graph/getKnownFollowers";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getKnownFollowers", () => {
  const { ctx } = testSetup;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const createFollow = (
    account: Account,
    followee: Account,
    date = new Date(),
  ) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ accountDid: () => account.did })
            .create(),
        followee: () => followee,
      })
      .props({ createdAt: () => date, indexedAt: () => date })
      .create();

  test("getKnownFollowers-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const subject = await createAccount();

    // act
    const promise = client.call(getKnownFollowers, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getKnownFollowers-2: 指定したアカウントをsubjectに、閲覧者がフォローしているそのフォロワーだけをfollowersにprofileViewで返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createAccount();
    const subject = await createAccount();
    const known = await createAccount();
    const unknown = await createAccount();
    const followedOnly = await createAccount();
    await createFollow(viewer, known);
    await createFollow(viewer, followedOnly);
    await createFollow(known, subject);
    await createFollow(unknown, subject);
    loginAs(viewer.did);

    // act
    const res = await client.call(getKnownFollowers, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    expect(res).toMatchObject({
      subject: { did: subject.did },
      followers: [{ did: known.did }],
    });
  });

  test("getKnownFollowers-3: 閲覧者がフォローした新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createAccount();
    const subject = await createAccount();
    const create = async (date: Date) => {
      const other = await createAccount();
      await createFollow(viewer, other, date);
      await createFollow(other, subject);
      return other;
    };
    const oldAccount = await create(new Date("2024-01-01"));
    const middleAccount = await create(new Date("2024-01-02"));
    const newAccount = await create(new Date("2024-01-03"));
    loginAs(viewer.did);

    // act
    const firstPage = await client.call(getKnownFollowers, {
      actor: asAtIdentifierString(subject.did),
      limit: 2,
    });
    const secondPage = await client.call(getKnownFollowers, {
      actor: asAtIdentifierString(subject.did),
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
