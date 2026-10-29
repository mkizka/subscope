import searchActorsTypeahead from "@repo/client/lex/app/bsky/actor/searchActorsTypeahead";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.searchActorsTypeahead", () => {
  const { ctx } = testSetup;

  test("searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewBasicで返す", async () => {
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
    const res = await client.call(searchActorsTypeahead, {
      q: "zqx",
    });

    // assert
    expect(res.actors).toMatchObject([
      { did: actor.did, displayName: "Zqx Alice" },
    ]);
  });
});
