import getRegisteredAccounts from "@repo/client/lex/me/subsco/server/getRegisteredAccounts";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getRegisteredAccounts", () => {
  const { ctx } = testSetup;

  test("getRegisteredAccounts-1: 登録アカウントごとにprofileViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    await actorFactory(ctx.db).create();

    // act
    const res = await client.call(getRegisteredAccounts);

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

  test("getRegisteredAccounts-2: 登録アカウントごとに管理者かどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();

    // act
    const res = await client.call(getRegisteredAccounts);

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
});
