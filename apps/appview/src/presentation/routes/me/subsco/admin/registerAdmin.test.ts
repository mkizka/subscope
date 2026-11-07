import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import registerAdmin from "@repo/client/me/subsco/admin/registerAdmin";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.registerAdmin", () => {
  const { ctx } = testSetup;
  const requesterDid = asDid("did:plc:requester");

  test("registerAdmin-1: 閲覧者を管理者にし、メンバーにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    loginAs(requesterDid);

    // act
    await client.call(registerAdmin);

    // assert
    const [account] = await ctx.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.did, requesterDid));
    expect(account?.isAdmin).toBe(true);
    const registrations = await ctx.db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.accountDid, requesterDid));
    expect(registrations).toHaveLength(1);
  });

  test("registerAdmin-2: 既に管理者がいれば、400とAdminAlreadyExistsを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(requesterDid);

    // act
    const promise = client.call(registerAdmin);

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "AdminAlreadyExists",
    });
  });

  test("registerAdmin-3: 閲覧者のsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    loginAs(requesterDid);

    // act
    await client.call(registerAdmin);

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([{ did: requesterDid }]);
  });

  test("registerAdmin-4: 閲覧者のプロフィールのfetchRecordジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    loginAs(requesterDid);

    // act
    await client.call(registerAdmin);

    // assert
    expect(jobScheduler.getFetchRecordJobs()).toEqual([
      {
        uri: AtUri.make(requesterDid, "app.bsky.actor.profile", "self"),
        live: true,
        depth: 0,
      },
    ]);
  });

  test("registerAdmin-5: 閲覧者のハンドルが未取得ならresolveDidジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    loginAs(requesterDid);

    // act
    await client.call(registerAdmin);

    // assert
    expect(jobScheduler.getResolveDidJobs()).toEqual([
      { did: requesterDid, live: true },
    ]);
  });
});
