import getServerMembers from "@repo/client/me/subsco/server/getServerMembers";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getServerMembers", () => {
  const { ctx } = testSetup;

  test("getServerMembers-1: 登録アカウントごとにprofileViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    await accountFactory(ctx.db).create();

    // act
    const res = await client.call(getServerMembers);

    // assert
    expect(res.registeredAccounts).toMatchObject([
      {
        profile: {
          did: registeredAccount.did,
          handle: registeredAccount.handle,
        },
      },
    ]);
  });

  test("getServerMembers-2: 登録アカウントごとに管理者かどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();

    // act
    const res = await client.call(getServerMembers);

    // assert
    expect(res.registeredAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          profile: expect.objectContaining({ did: admin.did }),
          isAdmin: true,
        }),
        expect.objectContaining({
          profile: expect.objectContaining({ did: registeredAccount.did }),
          isAdmin: false,
        }),
      ]),
    );
  });

  test("getServerMembers-3: qを指定すると、表示名またはハンドルにqを含む登録アカウントだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const byName = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .use((t) => t.withProfile({ displayName: "Needle Name" }))
      .create();
    const byHandle = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ handle: () => "needle.test" })
      .create();
    await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .use((t) => t.withProfile({ displayName: "Other" }))
      .create();

    // act
    const res = await client.call(getServerMembers, { q: "NEEDLE" });

    // assert
    expect(res.registeredAccounts.map((a) => a.profile.did).sort()).toEqual(
      [byName.did, byHandle.did].sort(),
    );
  });
});
