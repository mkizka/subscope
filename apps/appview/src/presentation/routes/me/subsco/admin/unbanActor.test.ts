import { asDid } from "@atproto/did";
import unbanActor from "@repo/client/lex/me/subsco/admin/unbanActor";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";
import { actorFactory, inviteCodeFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.unbanActor", () => {
  const { ctx } = testSetup;

  test("unbanActor-1: BANを解除したアカウントは招待コードで再登録できる", async () => {
    // arrange
    const { client, createClient, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const banned = await actorFactory(ctx.db)
      .props({ isBanned: () => true })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    loginAs(admin.did);
    const bannedClient = createClient();
    loginAs(banned.did, bannedClient);

    // act
    await client.call(unbanActor, { did: asDid(banned.did) });

    // assert
    await expect(
      bannedClient.call(subscribeServer, { inviteCode: inviteCode.code }),
    ).resolves.toBeDefined();
  });

  test("unbanActor-2: BANされていないアカウントには400とNotBannedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const actor = await actorFactory(ctx.db).create();
    loginAs(admin.did);

    // act
    const promise = client.call(unbanActor, { did: asDid(actor.did) });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotBanned",
    });
  });
});
