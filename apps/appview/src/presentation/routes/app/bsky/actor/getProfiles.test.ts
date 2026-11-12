import { asAtIdentifierString } from "@atproto/syntax";
import getProfiles from "@repo/client/app/bsky/actor/getProfiles";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfiles", () => {
  const { ctx } = testSetup;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const createFollow = (account: Account, followee: Account, date: Date) =>
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

  const setupKnownFollowers = async (count: number) => {
    const viewer = await createAccount();
    const subject = await createAccount();
    const known: Account[] = [];
    for (let i = 0; i < count; i++) {
      const other = await createAccount();
      await createFollow(viewer, other, new Date(2025, 0, i + 1));
      await createFollow(other, subject, new Date());
      known.push(other);
    }
    return { viewer, subject, known };
  };

  test("getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアカウントだけを指定した順に返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const alice = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const bob = await accountFactory(ctx.db)
      .props({ handle: () => "bob.test" })
      .use((t) => t.withProfile({}))
      .create();

    // act
    const res = await client.call(getProfiles, {
      actors: [alice.did, "bob.test", "notfound.test"].map(
        asAtIdentifierString,
      ),
    });

    // assert
    expect(res.profiles).toMatchObject([
      { did: alice.did },
      { did: bob.did, handle: "bob.test" },
    ]);
  });

  test("getProfiles-2: 閲覧者がフォローしているフォロワーがいるアカウントには、viewer.knownFollowersを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const { viewer, subject, known } = await setupKnownFollowers(1);
    loginAs(viewer.did);

    // act
    const res = await client.call(getProfiles, {
      actors: [asAtIdentifierString(subject.did)],
    });

    // assert
    expect(res.profiles[0]?.viewer?.knownFollowers).toMatchObject({
      count: 1,
      followers: [{ did: known[0]?.did }],
    });
  });
});
