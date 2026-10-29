import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.searchActors", () => {
  const { ctx } = testSetup;

  test("searchActors-1: 表示名が検索語に部分一致するアクターがある場合、そのアクターのprofileViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zqx Alice" }))
      .create();
    await actorFactory(ctx.db)
      .props({ handle: () => "bob.test" })
      .use((t) => t.withProfile({ displayName: "Bob" }))
      .create();

    // act
    const res = await client.app.bsky.actor.searchActors({ q: "zqx" });

    // assert
    expect(res.data.actors).toMatchObject([
      { did: actor.did, displayName: "Zqx Alice" },
    ]);
  });
});
