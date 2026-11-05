import verifyAccess from "@repo/client/me/subsco/admin/verifyAccess";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.verifyAccess", () => {
  const { ctx } = testSetup;

  test("verifyAccess-1: 閲覧者が管理者ならstatusをauthorizedにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const result = await client.call(verifyAccess);

    // assert
    expect(result).toEqual({ status: "authorized" });
  });

  test("verifyAccess-2: 閲覧者が管理者でなければstatusをunauthorizedにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const account = await accountFactory(ctx.db).create();
    loginAs(account.did);

    // act
    const result = await client.call(verifyAccess);

    // assert
    expect(result).toEqual({ status: "unauthorized" });
  });
});
