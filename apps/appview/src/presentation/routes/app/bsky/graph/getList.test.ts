import { asAtUriString } from "@atproto/syntax";
import getList from "@repo/client/lex/app/bsky/graph/getList";
import {
  actorFactory,
  listFactory,
  listItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getList", () => {
  const { ctx } = testSetup;

  test("getList-1: 指定したリストのlistViewと、リストに追加されたアクターのprofileViewをitemsで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const creator = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const list = await listFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.list")
            .vars({ actorDid: () => creator.did })
            .create(),
      })
      .create();
    const subject = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const listItem = await listItemFactory(ctx.db)
      .vars({ list: () => list, subject: () => subject })
      .create();

    // act
    const res = await client.call(getList, { list: asAtUriString(list.uri) });

    // assert
    expect(res.list).toMatchObject({
      uri: list.uri,
      name: list.name,
      creator: { did: creator.did },
    });
    expect(res.items).toMatchObject([
      { uri: listItem.uri, subject: { did: subject.did } },
    ]);
  });

  test("getList-2: 保存されていないリストには400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getList, {
      list: "at://did:plc:notfound/app.bsky.graph.list/notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });
});
