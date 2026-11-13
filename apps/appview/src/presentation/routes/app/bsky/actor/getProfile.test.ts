import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import {
  accountFactory,
  followFactory,
  labelFactory,
  profileFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfile", () => {
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

  test("getProfile-1: 指定したアカウントのprofileViewDetailedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Alice" }))
      .create();

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res).toMatchObject({
      did: account.did,
      handle: account.handle,
      displayName: "Alice",
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });
  });

  test("getProfile-2: 保存されていないアカウントには400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getProfile, {
      actor: "did:plc:notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });

  test("getProfile-3: プロフィールレコードがないアカウントには、DIDとハンドルだけのprofileViewDetailedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res).toMatchObject({
      did: account.did,
      handle: account.handle,
    });
    expect(res.displayName).toBeUndefined();
  });

  test("getProfile-4: テイクダウンされたアカウントと、状態が takendown か suspended のアカウントには400とAccountTakedownを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const label = await labelFactory(ctx.db).create();
    const takendown = await accountFactory(ctx.db)
      .props({ status: () => "takendown" })
      .create();
    const suspended = await accountFactory(ctx.db)
      .props({ status: () => "suspended" })
      .create();

    // act
    const promises = [label.accountDid, takendown.did, suspended.did].map(
      (did) => client.call(getProfile, { actor: asAtIdentifierString(did) }),
    );

    // assert
    await Promise.all(
      promises.map((promise) =>
        expect(promise).rejects.toMatchObject({
          status: 400,
          error: "AccountTakedown",
        }),
      ),
    );
  });

  test("getProfile-5: 状態が deactivated のアカウントには400とAccountDeactivatedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .props({ status: () => "deactivated" })
      .create();

    // act
    const promise = client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "AccountDeactivated",
    });
  });

  const createLink = (
    account: Awaited<ReturnType<ReturnType<typeof accountFactory>["create"]>>,
    url: string,
  ) =>
    recordFactory(ctx.db, "app.bsky.actor.link")
      .vars({ account: () => account })
      .props({
        json: () => ({
          $type: "app.bsky.actor.link",
          url,
          createdAt: new Date().toISOString(),
        }),
      })
      .create();

  const createProfileWithLinks = async (
    account: Awaited<ReturnType<ReturnType<typeof accountFactory>["create"]>>,
    links: { uri: string; cid: string }[],
  ) => {
    const record = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ account: () => account })
      .props({
        uri: () => `at://${account.did}/app.bsky.actor.profile/self`,
        json: () => ({ $type: "app.bsky.actor.profile", links }),
      })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => record })
      .create();
  };

  test("getProfile-6: プロフィールレコードのlinksが指す app.bsky.actor.link レコードを、linksの順にprofileLinkViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const first = await createLink(account, "https://example.com/first");
    const second = await createLink(account, "https://example.com/second");
    await createProfileWithLinks(account, [second, first]);

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.links?.map((link) => link.url)).toEqual([
      "https://example.com/second",
      "https://example.com/first",
    ]);
    expect(res.links?.[0]).toMatchObject({ uri: second.uri, cid: second.cid });
  });

  test("getProfile-7: 保存されていないリンクとテイクダウンされたリンクは、linksに含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const visible = await createLink(account, "https://example.com/visible");
    const takendown = await createLink(account, "https://example.com/hidden");
    await labelFactory(ctx.db)
      .props({ uri: () => takendown.uri, accountDid: () => account.did })
      .create();
    const missing = {
      uri: `at://${account.did}/app.bsky.actor.link/missing`,
      cid: visible.cid,
    };
    await createProfileWithLinks(account, [missing, takendown, visible]);

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.links?.map((link) => link.url)).toEqual([
      "https://example.com/visible",
    ]);
  });

  test("getProfile-8: 閲覧者がフォローしているフォロワーを、フォローした新しい順に最大5件、総数とともにviewer.knownFollowersに入れる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const { viewer, subject, known } = await setupKnownFollowers(6);
    loginAs(viewer.did);

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    expect(res.viewer?.knownFollowers?.count).toBe(6);
    expect(res.viewer?.knownFollowers?.followers.map((a) => a.did)).toEqual(
      known
        .slice(1)
        .reverse()
        .map((a) => a.did),
    );
  });

  test("getProfile-9: 該当するフォロワーがいない場合、未ログインの場合、閲覧者自身の場合は、viewer.knownFollowersを含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const { viewer, subject } = await setupKnownFollowers(1);
    const stranger = await createAccount();

    // act
    const anonymous = await client.call(getProfile, {
      actor: asAtIdentifierString(subject.did),
    });
    loginAs(stranger.did);
    const noKnown = await client.call(getProfile, {
      actor: asAtIdentifierString(subject.did),
    });
    loginAs(viewer.did);
    const self = await client.call(getProfile, {
      actor: asAtIdentifierString(viewer.did),
    });

    // assert
    expect(anonymous.viewer?.knownFollowers).toBeUndefined();
    expect(noKnown.viewer?.knownFollowers).toBeUndefined();
    expect(self.viewer?.knownFollowers).toBeUndefined();
  });

  test("getProfile-10: プロフィールレコードのpinnedPostを、pinnedPostに含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const post = { uri: `at://${account.did}/app.bsky.feed.post/1`, cid: "c" };
    const record = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ account: () => account })
      .props({
        uri: () => `at://${account.did}/app.bsky.actor.profile/self`,
        json: () => ({ $type: "app.bsky.actor.profile", pinnedPost: post }),
      })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => record })
      .create();

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.pinnedPost).toEqual(post);
  });
});
