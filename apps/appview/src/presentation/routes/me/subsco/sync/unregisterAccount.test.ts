import unregisterAccount from "@repo/client/lex/me/subsco/sync/unregisterAccount";
import { schema } from "@repo/db";
import {
  accountFactory,
  followFactory,
  inviteCodeFactory,
  recordFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.unregisterAccount", () => {
  const { ctx } = testSetup;

  test("unregisterAccount-1: 本人とそのフォロー先のsyncTapRepoジョブを積む", async () => {
    // arrange
    const { client, loginAs, jobScheduler } = await setupApiTest();
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
    loginAs(registeredAccount.did);

    // act
    await client.call(unregisterAccount);

    // assert
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([
      { did: registeredAccount.did },
      { did: followee.did },
    ]);
  });

  test("unregisterAccount-2: 登録を消し、使った招待コードは使用済みのまま残す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const usedAt = new Date("2025-01-01T00:00:00.000Z");
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({ usedAt: () => usedAt })
      .create();
    const registration = await registrationFactory(ctx.db)
      .vars({ inviteCode: () => inviteCode })
      .create();
    loginAs(registration.accountDid);

    // act
    await client.call(unregisterAccount);

    // assert
    const registrations = await ctx.db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.accountDid, registration.accountDid));
    expect(registrations).toEqual([]);
    const [savedInviteCode] = await ctx.db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, inviteCode.code));
    expect(savedInviteCode?.usedAt).toEqual(usedAt);
  });

  test("unregisterAccount-3: 登録していなければ400とNotRegisteredを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
    loginAs(account.did);

    // act
    const promise = client.call(unregisterAccount);

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotRegistered",
    });
  });
});
