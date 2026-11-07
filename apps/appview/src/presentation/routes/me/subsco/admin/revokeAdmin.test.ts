import { asDid } from "@atproto/did";
import revokeAdmin from "@repo/client/me/subsco/admin/revokeAdmin";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.revokeAdmin", () => {
  const { ctx } = testSetup;

  test("revokeAdmin-1: 指定した管理者の管理者権限を外す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);
    const target = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();

    // act
    await client.call(revokeAdmin, { did: asDid(target.did) });

    // assert
    const [account] = await ctx.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.did, target.did));
    expect(account?.isAdmin).toBe(false);
  });

  test("revokeAdmin-2: 自分自身には400とCannotRevokeSelfを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(revokeAdmin, { did: asDid(admin.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "CannotRevokeSelf",
    });
  });

  test("revokeAdmin-3: メンバーでないアカウントには400とNotRegisteredを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(revokeAdmin, {
      did: asDid("did:plc:notfound"),
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotRegistered",
    });
  });
});
