import getOperator from "@repo/client/me/subsco/server/getOperator";
import {
  accountFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getOperator", () => {
  const { ctx } = testSetup;

  test("getOperator-1: 管理者のうち最初に登録したメンバー1人だけをoperatorにprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const first = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const second = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    const member = await accountFactory(ctx.db).create();
    await registrationFactory(ctx.db)
      .vars({ account: () => member })
      .props({ createdAt: () => new Date("2024-01-01") })
      .create();
    await registrationFactory(ctx.db)
      .vars({ account: () => second })
      .props({ createdAt: () => new Date("2024-01-03") })
      .create();
    await registrationFactory(ctx.db)
      .vars({ account: () => first })
      .props({ createdAt: () => new Date("2024-01-02") })
      .create();

    // act
    const res = await client.call(getOperator);

    // assert
    expect(res.operator).toMatchObject({ did: first.did });
  });

  test("getOperator-2: 管理者がいなければoperatorを含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    const res = await client.call(getOperator);

    // assert
    expect(res.operator).toBeUndefined();
  });
});
