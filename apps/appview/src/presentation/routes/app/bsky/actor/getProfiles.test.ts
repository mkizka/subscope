import { asAtIdentifierString } from "@atproto/syntax";
import getProfiles from "@repo/client/lex/app/bsky/actor/getProfiles";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getProfiles", () => {
  const { ctx } = testSetup;

  test("getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアクターだけを指定した順に返す", async () => {
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
    const res = await client.call(getProfiles, {
      actors: [alice.did, "bob.test", "notfound.test"].map(
        asAtIdentifierString,
      ),
    });

    // assert
    expect(res.profiles).toMatchObject([
      { did: alice.did },
      { did: bob.did, handle: "bob.test" },
    ]);
  });
});
