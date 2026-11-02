import getRegistrationStatus from "@repo/client/lex/me/subsco/sync/getRegistrationStatus";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getRegistrationStatus", () => {
  const { ctx } = testSetup;

  test("getRegistrationStatus-1: 閲覧者が登録アカウントならisRegisteredをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    loginAs(registeredAccount.did);

    // act
    const result = await client.call(getRegistrationStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getRegistrationStatus#registered",
      isRegistered: true,
    });
  });

  test("getRegistrationStatus-2: 閲覧者が登録アカウントでなければisRegisteredをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    const result = await client.call(getRegistrationStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getRegistrationStatus#notRegistered",
      isRegistered: false,
    });
  });
});
