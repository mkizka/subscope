import listRegisteredAccounts from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";
import {
  actorFactory,
  followFactory,
  labelFactory,
  recordFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.listRegisteredAccounts", () => {
  const { ctx } = testSetup;

  test("listRegisteredAccounts-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(listRegisteredAccounts);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("listRegisteredAccounts-2: 管理者でないアカウントからのリクエストには403を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    loginAs(viewer.did);

    // act
    const promise = client.call(listRegisteredAccounts);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 403 });
  });

  test("listRegisteredAccounts-3: サブスクライバーごとにprofileViewと管理者かどうかを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listRegisteredAccounts);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { profile: { did: registeredAccount.did }, isAdmin: false },
    ]);
  });

  test("listRegisteredAccounts-4: テイクダウンされたサブスクライバーも含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    await labelFactory(ctx.db)
      .vars({ actor: () => registeredAccount })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listRegisteredAccounts);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { profile: { did: registeredAccount.did } },
    ]);
  });

  test("listRegisteredAccounts-5: サブスクライバーごとに登録日時をregisteredAtとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await actorFactory(ctx.db).create();
    await registrationFactory(ctx.db)
      .vars({ actor: () => registeredAccount })
      .props({ createdAt: () => new Date("2024-01-01T00:00:00.000Z") })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listRegisteredAccounts);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      {
        profile: { did: registeredAccount.did },
        registeredAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });

  test("listRegisteredAccounts-6: ページングに関係なくサブスクライバーの総数をtotalとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .createList(3);
    loginAs(admin.did);

    // act
    const res = await client.call(listRegisteredAccounts, { limit: 1 });

    // assert
    expect(res.registeredAccounts).toHaveLength(1);
    expect(res.total).toBe(3);
  });

  const setupBackfill = async (
    registeredAccountStatus: "inProgress" | "completed" | "error" | null,
    followeeStatus: "inProgress" | "completed" | "error" | null,
  ) => {
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ backfillStatus: () => registeredAccountStatus })
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => registeredAccount })
            .create(),
        followee: () =>
          actorFactory(ctx.db)
            .props({ backfillStatus: () => followeeStatus })
            .create(),
      })
      .create();
    loginAs(admin.did);
    return client;
  };

  test("listRegisteredAccounts-7: フォロー先の状態にかかわらず、サブスクライバー本人のバックフィルの状態をbackfillStatusとして返す", async () => {
    // arrange
    const client = await setupBackfill("completed", "error");

    // act
    const res = await client.call(listRegisteredAccounts);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { backfillStatus: "completed" },
    ]);
  });

  test("listRegisteredAccounts-8: サブスクライバー本人のバックフィルの状態をまだ確認していなければ、backfillStatusをinProgressにする", async () => {
    // arrange
    const client = await setupBackfill(null, "completed");

    // act
    const res = await client.call(listRegisteredAccounts);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { backfillStatus: "inProgress" },
    ]);
  });
});
