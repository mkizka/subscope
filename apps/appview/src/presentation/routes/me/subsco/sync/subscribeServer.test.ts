import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";
import { actorFactory, inviteCodeFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.subscribeServer", () => {
  const { ctx } = testSetup;

  test("subscribeServer-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す", async () => {
    // arrange
    const { createClient, loginAs } = await setupApiTest();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    const clients = await Promise.all(
      [0, 1, 2].map(async () => {
        const actor = await actorFactory(ctx.db).create();
        const client = createClient();
        loginAs(actor.did, client);
        return client;
      }),
    );

    // act
    const results = await Promise.allSettled(
      clients.map((client) =>
        client.call(subscribeServer, { inviteCode: inviteCode.code }),
      ),
    );

    // assert
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toMatchObject([
      { reason: { status: 400 } },
      { reason: { status: 400 } },
    ]);
  });
});
