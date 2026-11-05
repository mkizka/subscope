import searchActorsTypeahead from "@repo/client/app/bsky/actor/searchActorsTypeahead";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.searchActorsTypeahead", () => {
  const { ctx } = testSetup;

  test("searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアカウントをprofileViewBasicで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zqx Alice" }))
      .create();
    await accountFactory(ctx.db)
      .props({ handle: () => "bob.test" })
      .use((t) => t.withProfile({ displayName: "Bob" }))
      .create();

    // act
    const res = await client.call(searchActorsTypeahead, {
      q: "zqx",
    });

    // assert
    expect(res.actors).toMatchObject([
      { did: account.did, displayName: "Zqx Alice" },
    ]);
  });

  test("searchActorsTypeahead-2: ハンドルが検索語に部分一致するアカウントも返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .props({ handle: () => "zqx-carol.test" })
      .use((t) => t.withProfile({ displayName: "Carol" }))
      .create();

    // act
    const res = await client.call(searchActorsTypeahead, { q: "zqx" });

    // assert
    expect(res.actors).toMatchObject([{ did: account.did }]);
  });

  test("searchActorsTypeahead-3: 空白だけの検索語には何も返さない", async () => {
    // arrange
    const { client } = await setupApiTest();
    await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zqx Alice" }))
      .create();

    // act
    const res = await client.call(searchActorsTypeahead, { q: " " });

    // assert
    expect(res.actors).toEqual([]);
  });
});
