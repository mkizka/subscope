import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";
import { schema } from "@repo/db";
import { actorFactory, inviteCodeFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.subscribeServer", () => {
  const { ctx } = testSetup;

  const findSubscription = (did: string) =>
    ctx.db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.actorDid, did),
    });

  test("subscribeServer-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す", async () => {
    // arrange
    const { createClient, loginAs } = await setupApiTest();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    const clients = await Promise.all(
      [0, 1, 2].map(async () => {
        const actor = await actorFactory(ctx.db).create();
        const client = createClient();
        loginAs(actor.did, client);
        return client;
      }),
    );

    // act
    const results = await Promise.allSettled(
      clients.map((client) =>
        client.call(subscribeServer, { inviteCode: inviteCode.code }),
      ),
    );

    // assert
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toMatchObject([
      { reason: { status: 400 } },
      { reason: { status: 400 } },
    ]);
  });

  test("subscribeServer-2: BANされたアカウントは登録せず、400とBannedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .props({ isBanned: () => true })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    const promise = client.call(subscribeServer, {
      inviteCode: inviteCode.code,
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "Banned",
    });
  });

  test.each([
    { name: "指定なし", code: () => Promise.resolve(undefined) },
    { name: "存在しない", code: () => Promise.resolve("not-found") },
    {
      name: "期限切れ",
      code: async () =>
        (
          await inviteCodeFactory(ctx.db)
            .props({ expiresAt: () => new Date(Date.now() - 1000) })
            .create()
        ).code,
    },
    {
      name: "使用済み",
      code: async () =>
        (
          await inviteCodeFactory(ctx.db)
            .props({ usedAt: () => new Date() })
            .create()
        ).code,
    },
  ])(
    "subscribeServer-3: 管理者以外は、有効期限内の未使用の招待コードがなければ登録せず、400とInvalidInviteCodeを返す($name)",
    async ({ code }) => {
      // arrange
      const { client, loginAs } = await setupApiTest();
      const actor = await actorFactory(ctx.db).create();
      const inviteCode = await code();
      loginAs(actor.did);

      // act
      const promise = client.call(subscribeServer, { inviteCode });

      // assert
      await expect(promise).rejects.toMatchObject({
        status: 400,
        error: "InvalidInviteCode",
      });
      expect(await findSubscription(actor.did)).toBeUndefined();
    },
  );

  test("subscribeServer-4: 登録済みのアカウントは登録せず、400とAlreadySubscribedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    const promise = client.call(subscribeServer, {
      inviteCode: inviteCode.code,
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "AlreadySubscribed",
    });
  });

  test("subscribeServer-5: 管理者は招待コードなしで登録する", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    await client.call(subscribeServer, {});

    // assert
    expect(await findSubscription(admin.did)).toMatchObject({
      inviteCode: null,
    });
  });

  test("subscribeServer-6: 登録に使った招待コードを使用済みにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    await client.call(subscribeServer, { inviteCode: inviteCode.code });

    // assert
    const updated = await ctx.db.query.inviteCodes.findFirst({
      where: eq(schema.inviteCodes.code, inviteCode.code),
    });
    expect(updated?.usedAt).toBeInstanceOf(Date);
  });

  test("subscribeServer-7: 登録したアカウントのsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    await client.call(subscribeServer, { inviteCode: inviteCode.code });

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([{ did: actor.did }]);
  });

  test("subscribeServer-8: DBにないアカウントも登録する", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const did = "did:plc:notindexedyet";
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(did);

    // act
    await client.call(subscribeServer, { inviteCode: inviteCode.code });

    // assert
    expect(await findSubscription(did)).toMatchObject({
      inviteCode: inviteCode.code,
    });
  });
});
