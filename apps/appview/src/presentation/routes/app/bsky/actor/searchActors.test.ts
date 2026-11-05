import searchActors from "@repo/client/app/bsky/actor/searchActors";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.searchActors", () => {
  const { ctx } = testSetup;

  test("searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアカウントをprofileViewで返す", async () => {
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
    const res = await client.call(searchActors, { q: "zqx" });

    // assert
    expect(res.actors).toMatchObject([
      { did: account.did, displayName: "Zqx Alice" },
    ]);
  });

  test("searchActors-2: ハンドルが検索語に部分一致するアカウントも返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .props({ handle: () => "zqx-carol.test" })
      .use((t) => t.withProfile({ displayName: "Carol" }))
      .create();

    // act
    const res = await client.call(searchActors, { q: "zqx" });

    // assert
    expect(res.actors).toMatchObject([{ did: account.did }]);
  });

  test("searchActors-3: 空白だけの検索語には何も返さない", async () => {
    // arrange
    const { client } = await setupApiTest();
    await accountFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zqx Alice" }))
      .create();

    // act
    const res = await client.call(searchActors, { q: " " });

    // assert
    expect(res.actors).toEqual([]);
  });

  test("searchActors-4: cursorを指定すると、前のページに含めなかったアカウントを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const accounts = await Promise.all(
      ["Zqx A", "Zqx B", "Zqx C"].map((displayName) =>
        accountFactory(ctx.db)
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
    ).toEqual(accounts.map((a) => a.did).sort());
  });
});
