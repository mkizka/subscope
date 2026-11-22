import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import registerAdmin from "@repo/client/me/subsco/admin/registerAdmin";
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

  test("registerAdmin-3: 閲覧者とその保存済みのフォロー先をTapに追加するジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    const followee = await accountFactory(ctx.db).create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => account })
            .create(),
        followee: () => followee,
      })
      .create();
    loginAs(account.did);

    // act
    await client.call(registerAdmin);

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([
      { did: account.did, refetch: true },
      { did: followee.did },
    ]);
  });

  test("registerAdmin-4: 閲覧者のプロフィールを取得するジョブを積む", async () => {
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

  test("registerAdmin-5: 閲覧者のハンドルが未取得なら、ハンドルを解決するジョブを積む", async () => {
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
