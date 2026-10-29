import { asDid } from "@atproto/did";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import { schema } from "@repo/db";
import { actorFactory, subscriptionFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.grantAdmin", () => {
  const { ctx } = testSetup;

  test("grantAdmin-1: 指定したサブスクライバーを管理者にする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);
    const subscription = await subscriptionFactory(ctx.db).create();

    // act
    await client.call(grantAdmin, { did: asDid(subscription.actorDid) });

    // assert
    const [actor] = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, subscription.actorDid));
    expect(actor?.isAdmin).toBe(true);
  });

  test("grantAdmin-2: サブスクライバーでないアクターには400とNotSubscribedを返す", async () => {
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
      error: "NotSubscribed",
    });
  });
});
