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

  test("getList-1: リストを指定した場合、そのリストのlistViewをlist、追加されたアクターのprofileViewをitemsのsubjectとして返す", async () => {
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
    const res = await client.app.bsky.graph.getList({ list: list.uri });

    // assert
    expect(res.data.list).toMatchObject({
      uri: list.uri,
      name: list.name,
      creator: { did: creator.did },
    });
    expect(res.data.items).toMatchObject([
      { uri: listItem.uri, subject: { did: subject.did } },
    ]);
  });

  test("getList-2: 存在しないリストを指定した場合、400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.app.bsky.graph.getList({
      list: "at://did:plc:notfound/app.bsky.graph.list/notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });
});
