import getMembers from "@repo/client/lex/me/subsco/server/getMembers";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getMembers", () => {
  const { ctx } = testSetup;

  test("getMembers-1: メンバーごとにprofileViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const member = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await actorFactory(ctx.db).create();

    // act
    const res = await client.call(getMembers);

    // assert
    expect(res.members).toMatchObject([
      { did: member.did, handle: member.handle },
    ]);
  });
});
