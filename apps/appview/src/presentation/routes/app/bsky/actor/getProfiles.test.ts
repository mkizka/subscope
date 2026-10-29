import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfiles", () => {
  const { ctx } = testSetup;

  test("getProfiles-1: DIDとハンドルを混在して指定した場合、解決できたアクターのprofileViewDetailedを指定順に返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const alice = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const bob = await actorFactory(ctx.db)
      .props({ handle: () => "bob.test" })
      .use((t) => t.withProfile({}))
      .create();

    // act
    const res = await client.app.bsky.actor.getProfiles({
      actors: [alice.did, "bob.test", "notfound.test"],
    });

    // assert
    expect(res.data.profiles).toMatchObject([
      { did: alice.did },
      { did: bob.did, handle: "bob.test" },
    ]);
  });
});
