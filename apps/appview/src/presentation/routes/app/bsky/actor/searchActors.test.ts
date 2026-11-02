import searchActors from "@repo/client/lex/app/bsky/actor/searchActors";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.searchActors", () => {
  const { ctx } = testSetup;

  test("searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewで返す", async () => {
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
    const res = await client.call(searchActors, { q: "zqx" });

    // assert
    expect(res.actors).toMatchObject([
      { did: actor.did, displayName: "Zqx Alice" },
    ]);
  });

  test("searchActors-2: ハンドルが検索語に部分一致するアクターも返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .props({ handle: () => "zqx-carol.test" })
      .use((t) => t.withProfile({ displayName: "Carol" }))
      .create();

    // act
    const res = await client.call(searchActors, { q: "zqx" });

    // assert
    expect(res.actors).toMatchObject([{ did: actor.did }]);
  });

  test("searchActors-3: 空白だけの検索語には何も返さない", async () => {
    // arrange
    const { client } = await setupApiTest();
    await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zqx Alice" }))
      .create();

    // act
    const res = await client.call(searchActors, { q: " " });

    // assert
    expect(res.actors).toEqual([]);
  });

  test("searchActors-4: cursorを指定すると、前のページに含めなかったアクターを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actors = await Promise.all(
      ["Zqx A", "Zqx B", "Zqx C"].map((displayName) =>
        actorFactory(ctx.db)
          .use((t) => t.withProfile({ displayName }))
          .create(),
      ),
    );

    // act
    const firstPage = await client.call(searchActors, { q: "zqx", limit: 2 });
    const secondPage = await client.call(searchActors, {
      q: "zqx",
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.actors).toHaveLength(2);
    expect(
      [...firstPage.actors, ...secondPage.actors].map((a) => a.did).sort(),
    ).toEqual(actors.map((a) => a.did).sort());
  });
});
