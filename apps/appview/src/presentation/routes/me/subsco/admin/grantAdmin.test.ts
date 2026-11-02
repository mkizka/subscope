import { asDid } from "@atproto/did";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import { schema } from "@repo/db";
import { actorFactory, registrationFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.grantAdmin", () => {
  const { ctx } = testSetup;

  test("grantAdmin-1: 指定した登録アカウントを管理者にする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);
    const registration = await registrationFactory(ctx.db).create();

    // act
    await client.call(grantAdmin, { did: asDid(registration.actorDid) });

    // assert
    const [actor] = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, registration.actorDid));
    expect(actor?.isAdmin).toBe(true);
  });

  test("grantAdmin-2: 登録アカウントでないアカウントには400とNotRegisteredを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);
    const actor = await actorFactory(ctx.db).create();

    // act
    const promise = client.call(grantAdmin, { did: asDid(actor.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotRegistered",
    });
  });
});
