import { asDid } from "@atproto/did";
import unbanAccount from "@repo/client/me/subsco/admin/unbanAccount";
import registerAccount from "@repo/client/me/subsco/sync/registerAccount";
import { accountFactory, inviteCodeFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.unbanAccount", () => {
  const { ctx } = testSetup;

  test("unbanAccount-1: BANを解除したアカウントは招待コードで再登録できる", async () => {
    // arrange
    const { client, createClient, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const banned = await accountFactory(ctx.db)
      .props({ isBanned: () => true })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(admin.did);
    const bannedClient = createClient();
    loginAs(banned.did, bannedClient);

    // act
    await client.call(unbanAccount, { did: asDid(banned.did) });

    // assert
    await expect(
      bannedClient.call(registerAccount, { inviteCode: inviteCode.code }),
    ).resolves.toBeDefined();
  });

  test("unbanAccount-2: BANされていないアカウントには400とNotBannedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const account = await accountFactory(ctx.db).create();
    loginAs(admin.did);

    // act
    const promise = client.call(unbanAccount, { did: asDid(account.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotBanned",
    });
  });
});
