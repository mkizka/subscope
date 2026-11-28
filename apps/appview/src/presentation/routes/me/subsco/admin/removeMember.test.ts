import { asDid } from "@atproto/did";
import removeMember from "@repo/client/me/subsco/admin/removeMember";
import { schema } from "@repo/db";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.removeMember", () => {
  const { ctx } = testSetup;

  test("removeMember-1: 管理者は登録を消さず、400とCannotRemoveAdminを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .use((t) => t.serverMember())
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(removeMember, { did: asDid(admin.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "CannotRemoveAdmin",
    });
  });

  test("removeMember-2: 本人とそのフォロー先について、Tapに追加するか外すかを決めるジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => serverMember })
            .create(),
        followee: () => followee,
      })
      .create();
    loginAs(admin.did);

    // act
    await client.call(removeMember, { did: asDid(serverMember.did) });

    // assert
    expect(jobScheduler.getSyncAccountKindJobs()).toEqual([
      { did: asDid(serverMember.did) },
      { did: followee.did },
    ]);
  });

  test("removeMember-3: 登録を消す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    loginAs(admin.did);

    // act
    await client.call(removeMember, { did: asDid(serverMember.did) });

    // assert
    const registrations = await ctx.db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.accountDid, serverMember.did));
    expect(registrations).toEqual([]);
  });
});
