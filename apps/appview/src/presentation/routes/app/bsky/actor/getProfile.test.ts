import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfile", () => {
  const { ctx } = testSetup;

  test("getProfile-1: プロフィールがあるアクターを指定した場合、そのアクターのprofileViewDetailedを返す", async () => {
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
    });
  });

  test("getProfile-2: 存在しないアクターを指定した場合、400を返す", async () => {
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
});
