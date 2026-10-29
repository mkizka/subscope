import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";
import { actorFactory, inviteCodeFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.deleteInviteCode", () => {
  const { ctx } = testSetup;

  test("deleteInviteCode-1: 存在しない招待コードを指定した場合、400とInviteCodeNotFoundを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(deleteInviteCode, {
      code: "notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "InviteCodeNotFound",
    });
  });

  test("deleteInviteCode-2: 使用済みの招待コードを指定した場合、400とInviteCodeAlreadyUsedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({ usedAt: () => new Date() })
      .create();

    // act
    const promise = client.call(deleteInviteCode, {
      code: inviteCode.code,
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "InviteCodeAlreadyUsed",
    });
  });
});
