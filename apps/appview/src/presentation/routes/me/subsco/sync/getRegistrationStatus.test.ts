import getRegistrationStatus from "@repo/client/me/subsco/sync/getRegistrationStatus";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getRegistrationStatus", () => {
  const { ctx } = testSetup;

  test("getRegistrationStatus-1: 閲覧者がメンバーならisMemberをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    loginAs(serverMember.did);

    // act
    const result = await client.call(getRegistrationStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getRegistrationStatus#member",
      isMember: true,
    });
  });

  test("getRegistrationStatus-2: 閲覧者がメンバーでなければisMemberをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    loginAs(account.did);

    // act
    const result = await client.call(getRegistrationStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getRegistrationStatus#notMember",
      isMember: false,
    });
  });
});
