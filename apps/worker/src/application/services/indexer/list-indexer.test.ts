import { actorFactory, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testRegistry } from "../../../shared/test-utils.js";

describe("ListIndexer", () => {
  test("リストレコードを正しく保存する", async () => {
    // arrange
    const { listIndexer, listRepository, db } = await testRegistry.resolve();
    const actor = actorFactory();
    const record = recordFactory({
      uri: `at://${actor.did}/app.bsky.graph.list/listrkey123`,
      json: {
        $type: "app.bsky.graph.list",
        purpose: "app.bsky.graph.defs#curatelist",
        name: "テストリスト",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await listIndexer.upsert({ ctx: { db }, record });

    // assert
    expect(listRepository.findByUri(record.uri)).toMatchObject({
      actorDid: actor.did,
      purpose: "app.bsky.graph.defs#curatelist",
      name: "テストリスト",
    });
  });
});
