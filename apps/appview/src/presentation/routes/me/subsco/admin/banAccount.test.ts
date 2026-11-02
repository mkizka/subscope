import { asDid } from "@atproto/did";
import banAccount from "@repo/client/lex/me/subsco/admin/banAccount";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.banAccount", () => {
  const { ctx } = testSetup;

  test("banAccount-1: 管理者はBANせず、400とCannotBanAdminを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .use((t) => t.registeredAccount())
      .create();
    loginAs(admin.did);

    // act
    const promise = client.call(banAccount, { did: asDid(admin.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "CannotBanAdmin",
    });
  });

  test("banAccount-2: 本人とそのフォロー先のsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registeredAccount = await accountFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => registeredAccount })
            .create(),
        followee: () => followee,
      })
      .create();
    loginAs(admin.did);

    // act
    await client.call(banAccount, { did: asDid(registeredAccount.did) });

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([
      { did: asDid(registeredAccount.did) },
      { did: followee.did },
    ]);
  });
});
