import { asAtIdentifierString } from "@atproto/syntax";
import getLists from "@repo/client/app/bsky/graph/getLists";
import {
  accountFactory,
  listFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getLists", () => {
  const { ctx } = testSetup;

  const createList = (accountDid: string, purpose: string) =>
    listFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.list")
            .vars({ accountDid: () => accountDid })
            .create(),
      })
      .props({ purpose: () => purpose })
      .create();

  test("getLists-1: 指定したアカウントが作成したリストをlistViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const list = await createList(
      account.did,
      "app.bsky.graph.defs#curatelist",
    );

    // act
    const res = await client.call(getLists, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.lists).toMatchObject([
      { uri: list.uri, name: list.name, creator: { did: account.did } },
    ]);
  });

  test("getLists-2: purposesを指定すると、その用途のリストだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const curatelist = await createList(
      account.did,
      "app.bsky.graph.defs#curatelist",
    );
    await createList(account.did, "app.bsky.graph.defs#modlist");

    // act
    const res = await client.call(getLists, {
      actor: asAtIdentifierString(account.did),
      purposes: ["curatelist"],
    });

    // assert
    expect(res.lists).toMatchObject([{ uri: curatelist.uri }]);
  });
});
