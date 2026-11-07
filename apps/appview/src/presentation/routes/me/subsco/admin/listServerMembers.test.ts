import listServerMembers from "@repo/client/me/subsco/admin/listServerMembers";
import {
  accountFactory,
  followFactory,
  labelFactory,
  recordFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.listServerMembers", () => {
  const { ctx } = testSetup;

  test("listServerMembers-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(listServerMembers);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("listServerMembers-2: 管理者でないアカウントからのリクエストには403を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    loginAs(viewer.did);

    // act
    const promise = client.call(listServerMembers);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 403 });
  });

  test("listServerMembers-3: 登録アカウントごとにprofileViewと管理者かどうかを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { profile: { did: registeredAccount.did }, isAdmin: false },
    ]);
  });

  test("listServerMembers-4: テイクダウンされた登録アカウントも含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    await labelFactory(ctx.db)
      .vars({ account: () => registeredAccount })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { profile: { did: registeredAccount.did } },
    ]);
  });

  test("listServerMembers-5: 登録アカウントごとに登録日時をregisteredAtとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db).create();
    await registrationFactory(ctx.db)
      .vars({ account: () => registeredAccount })
      .props({ createdAt: () => new Date("2024-01-01T00:00:00.000Z") })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(listServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      {
        profile: { did: registeredAccount.did },
        registeredAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });

  test("listServerMembers-6: ページングに関係なく登録アカウントの総数をtotalとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .createList(3);
    loginAs(admin.did);

    // act
    const res = await client.call(listServerMembers, { limit: 1 });

    // assert
    expect(res.registeredAccounts).toHaveLength(1);
    expect(res.total).toBe(3);
  });

  const setupBackfill = async (
    registeredAccountStatus: "inProgress" | "completed" | "error" | null,
    followeeStatus: "inProgress" | "completed" | "error" | null,
  ) => {
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ backfillStatus: () => registeredAccountStatus })
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => registeredAccount })
            .create(),
        followee: () =>
          accountFactory(ctx.db)
            .props({ backfillStatus: () => followeeStatus })
            .create(),
      })
      .create();
    loginAs(admin.did);
    return client;
  };

  test("listServerMembers-7: フォロー先の状態にかかわらず、登録アカウント本人のバックフィルの状態をbackfillStatusとして返す", async () => {
    // arrange
    const client = await setupBackfill("completed", "error");

    // act
    const res = await client.call(listServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { backfillStatus: "completed" },
    ]);
  });

  test("listServerMembers-8: 登録アカウント本人のバックフィルの状態をまだ確認していなければ、backfillStatusをinProgressにする", async () => {
    // arrange
    const client = await setupBackfill(null, "completed");

    // act
    const res = await client.call(listServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      { backfillStatus: "inProgress" },
    ]);
  });
});
