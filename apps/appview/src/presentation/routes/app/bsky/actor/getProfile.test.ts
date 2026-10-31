import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { actorFactory, labelFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfile", () => {
  const { ctx } = testSetup;

  test("getProfile-1: 指定したアクターのprofileViewDetailedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Alice" }))
      .create();

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(actor.did),
    });

    // assert
    expect(res).toMatchObject({
      did: actor.did,
      handle: actor.handle,
      displayName: "Alice",
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });
  });

  test("getProfile-2: 保存されていないアクターには400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getProfile, {
      actor: "did:plc:notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });

  test("getProfile-3: プロフィールレコードがないアクターには、DIDとハンドルだけのprofileViewDetailedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();

    // act
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(actor.did),
    });

    // assert
    expect(res).toMatchObject({
      did: actor.did,
      handle: actor.handle,
    });
    expect(res.displayName).toBeUndefined();
  });

  test("getProfile-4: テイクダウンされたアカウントと、状態が takendown か suspended のアカウントには400とAccountTakedownを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const label = await labelFactory(ctx.db).create();
    const takendown = await actorFactory(ctx.db)
      .props({ status: () => "takendown" })
      .create();
    const suspended = await actorFactory(ctx.db)
      .props({ status: () => "suspended" })
      .create();

    // act
    const promises = [label.actorDid, takendown.did, suspended.did].map((did) =>
      client.call(getProfile, { actor: asAtIdentifierString(did) }),
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
    const actor = await actorFactory(ctx.db)
      .props({ status: () => "deactivated" })
      .create();

    // act
    const promise = client.call(getProfile, {
      actor: asAtIdentifierString(actor.did),
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "AccountDeactivated",
    });
  });
});
