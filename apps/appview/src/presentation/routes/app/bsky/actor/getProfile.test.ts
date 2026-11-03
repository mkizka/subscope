import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import {
  accountFactory,
  labelFactory,
  profileFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfile", () => {
  const { ctx } = testSetup;

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
      .props({ json: () => ({ $type: "app.bsky.actor.profile", links }) })
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
});
