import getBannedAccounts from "@repo/client/lex/me/subsco/admin/getBannedAccounts";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.getBannedAccounts", () => {
  const { ctx } = testSetup;

  test("getBannedAccounts-1: BANされたアカウントのprofileViewを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const banned = await actorFactory(ctx.db)
      .props({ isBanned: () => true })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(getBannedAccounts);

    // assert
    expect(res.actors).toMatchObject([{ did: banned.did }]);
  });

  test("getBannedAccounts-2: BANされていないアカウントは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    await actorFactory(ctx.db).create();
    loginAs(admin.did);

    // act
    const res = await client.call(getBannedAccounts);

    // assert
    expect(res.actors).toEqual([]);
  });
});
