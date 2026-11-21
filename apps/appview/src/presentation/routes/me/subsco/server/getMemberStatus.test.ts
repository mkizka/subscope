import { asDid } from "@atproto/did";
import getMemberStatus from "@repo/client/me/subsco/server/getMemberStatus";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getMemberStatus", () => {
  const { ctx } = testSetup;

  test("getMemberStatus-1: メンバーならisMemberをtrueにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    const result = await client.call(getMemberStatus, {
      did: asDid(serverMember.did),
    });

    // assert
    expect(result).toEqual({ isMember: true });
  });

  test("getMemberStatus-2: メンバーでなければisMemberをfalseにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();

    // act
    const result = await client.call(getMemberStatus, {
      did: asDid(account.did),
    });

    // assert
    expect(result).toEqual({ isMember: false });
  });
});
