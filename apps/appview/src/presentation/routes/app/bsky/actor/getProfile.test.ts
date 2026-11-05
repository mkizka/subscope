import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import { accountFactory, labelFactory, testSetup } from "@repo/test-utils";
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
});
