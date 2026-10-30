import getMembers from "@repo/client/lex/me/subsco/server/getMembers";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getMembers", () => {
  const { ctx } = testSetup;

  test("getMembers-1: サブスクライバーでないアカウントからのリクエストには403とNotSubscribedを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    loginAs(viewer.did);

    // act
    const promise = client.call(getMembers);

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 403,
      error: "NotSubscribed",
    });
  });

  test("getMembers-2: メンバーごとにprofileViewを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const member = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getMembers);

    // assert
    expect(res.members).toHaveLength(2);
    expect(res.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ did: member.did, handle: member.handle }),
        expect.objectContaining({ did: viewer.did, handle: viewer.handle }),
      ]),
    );
  });
});
