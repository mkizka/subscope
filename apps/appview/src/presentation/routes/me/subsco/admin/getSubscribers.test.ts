import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";
import {
  actorFactory,
  labelFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
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

  test("getSubscribers-4: テイクダウンされたサブスクライバーも含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await labelFactory(ctx.db)
      .vars({ actor: () => subscriber })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(getSubscribers);

    // assert
    expect(res.subscribers).toMatchObject([
      { profile: { did: subscriber.did } },
    ]);
  });

  test("getSubscribers-5: サブスクライバーごとに登録日時をsubscribedAtとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const subscriber = await actorFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => subscriber })
      .props({ createdAt: () => new Date("2024-01-01T00:00:00.000Z") })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(getSubscribers);

    // assert
    expect(res.subscribers).toMatchObject([
      {
        profile: { did: subscriber.did },
        subscribedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });

  test("getSubscribers-6: ページングに関係なくサブスクライバーの総数をtotalとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .createList(3);
    loginAs(admin.did);

    // act
    const res = await client.call(getSubscribers, { limit: 1 });

    // assert
    expect(res.subscribers).toHaveLength(1);
    expect(res.total).toBe(3);
  });
});
