import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.getSubscribers", () => {
  const { ctx } = testSetup;

  test("getSubscribers-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getSubscribers);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getSubscribers-2: 管理者でないアカウントからのリクエストには403を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    loginAs(viewer.did);

    // act
    const promise = client.call(getSubscribers);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 403 });
  });

  test("getSubscribers-3: サブスクライバーごとにprofileViewと管理者かどうかを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(getSubscribers);

    // assert
    expect(res.subscribers).toMatchObject([
      { profile: { did: subscriber.did }, isAdmin: false },
    ]);
  });
});
