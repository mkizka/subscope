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
      { profile: { did: member.did, handle: member.handle } },
    ]);
  });

  test("getMembers-2: メンバーごとに管理者かどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .props({ isAdmin: () => true })
      .create();
    const member = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();

    // act
    const res = await client.call(getMembers);

    // assert
    expect(res.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          profile: expect.objectContaining({ did: admin.did }),
          isAdmin: true,
        }),
        expect.objectContaining({
          profile: expect.objectContaining({ did: member.did }),
          isAdmin: false,
        }),
      ]),
    );
  });
});
