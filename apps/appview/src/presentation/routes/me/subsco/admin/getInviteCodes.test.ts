import getInviteCodes from "@repo/client/lex/me/subsco/admin/getInviteCodes";
import {
  actorFactory,
  labelFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.getInviteCodes", () => {
  const { ctx } = testSetup;

  test("getInviteCodes-1: 使用済みの招待コードには使用したアカウントのprofileViewを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const registration = await registrationFactory(ctx.db).create();
    loginAs(admin.did);

    // act
    const res = await client.call(getInviteCodes);

    // assert
    expect(res.codes).toMatchObject([
      {
        code: registration.inviteCode,
        usedBy: { did: registration.actorDid },
      },
    ]);
  });

  test("getInviteCodes-2: 使用したアカウントがテイクダウンされていてもprofileViewを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const actor = await actorFactory(ctx.db).create();
    const registration = await registrationFactory(ctx.db)
      .vars({ actor: () => actor })
      .create();
    await labelFactory(ctx.db)
      .vars({ actor: () => actor })
      .create();
    loginAs(admin.did);

    // act
    const res = await client.call(getInviteCodes);

    // assert
    expect(res.codes).toMatchObject([
      {
        code: registration.inviteCode,
        usedBy: { did: actor.did },
      },
    ]);
  });
});
