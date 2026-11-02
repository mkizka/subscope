import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getSetupStatus", () => {
  const { ctx } = testSetup;

  test("getSetupStatus-1: 管理者が未登録ならinitializedをfalseにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    await actorFactory(ctx.db).create();

    // act
    const result = await client.call(getSetupStatus);

    // assert
    expect(result).toEqual({ initialized: false });
  });

  test("getSetupStatus-2: 管理者が登録済みならinitializedをtrueにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();

    // act
    const result = await client.call(getSetupStatus);

    // assert
    expect(result).toEqual({ initialized: true });
  });
});
