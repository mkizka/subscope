import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  listFactory,
  listItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ListQuery } from "./list-query.js";

describe("ListQuery", () => {
  const { ctx } = testSetup;

  const listQuery = new ListQuery(ctx.db);

  test("findByActor: 指定したアクターと用途のリストのうち、カーソルより古いものを新しい順に返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const listAt = (
      createdAt: string,
      purpose = "app.bsky.graph.defs#curatelist",
    ) =>
      listFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.list")
              .vars({ actor: () => actor })
              .create(),
        })
        .props({
          createdAt: () => new Date(createdAt),
          purpose: () => purpose,
        })
        .create();
    const [older, newer] = await Promise.all([
      listAt("2024-01-01T00:00:00.000Z"),
      listAt("2024-01-02T00:00:00.000Z"),
      listAt("2024-01-03T00:00:00.000Z"),
      listAt("2024-01-02T00:00:00.000Z", "app.bsky.graph.defs#modlist"),
      listFactory(ctx.db).create(),
    ]);

    // act
    const result = await listQuery.findByActor({
      actorDid: asDid(actor.did),
      limit: 10,
      cursor: "2024-01-03T00:00:00.000Z",
      purposes: ["app.bsky.graph.defs#curatelist"],
    });

    // assert
    expect(result.map((list) => list.uri)).toEqual([newer.uri, older.uri]);
  });

  test("findItems: 指定したリストの項目のうち、カーソルより古いものを新しい順に返す", async () => {
    // arrange
    const list = await listFactory(ctx.db).create();
    const itemAt = (createdAt: string) =>
      listItemFactory(ctx.db)
        .vars({ list: () => list })
        .props({ createdAt: () => new Date(createdAt) })
        .create();
    const [older, newer] = await Promise.all([
      itemAt("2024-01-01T00:00:00.000Z"),
      itemAt("2024-01-02T00:00:00.000Z"),
      itemAt("2024-01-03T00:00:00.000Z"),
      listItemFactory(ctx.db).create(),
    ]);

    // act
    const result = await listQuery.findItems({
      listUri: new AtUri(list.uri),
      limit: 10,
      cursor: "2024-01-03T00:00:00.000Z",
    });

    // assert
    expect(result).toEqual([
      {
        uri: newer.uri,
        subjectDid: newer.subjectDid,
        createdAt: newer.createdAt,
      },
      {
        uri: older.uri,
        subjectDid: older.subjectDid,
        createdAt: older.createdAt,
      },
    ]);
  });
});
