import { AtUri } from "@atproto/syntax";
import { recordFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RecordQuery } from "./record-query.js";

describe("RecordQuery", () => {
  const { ctx } = testSetup;

  const recordQuery = new RecordQuery(ctx.db);

  describe("findRecords", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await recordQuery.findRecords([]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在しないレコードは含めない", async () => {
      // act
      const result = await recordQuery.findRecords([
        new AtUri("at://did:plc:notfound/app.bsky.feed.post/notfound123"),
      ]);

      // assert
      expect(result).toEqual([]);
    });

    test("複数のURIが指定された場合、それぞれのレコードをURI付きで返す", async () => {
      // arrange
      const [record1, record2] = await recordFactory(
        ctx.db,
        "app.bsky.feed.post",
      ).createList(2);

      // act
      const result = await recordQuery.findRecords([
        new AtUri(record1.uri),
        new AtUri(record2.uri),
      ]);

      // assert
      expect(result).toEqual(
        expect.arrayContaining(
          [record1, record2].map((record) => ({
            uri: record.uri,
            cid: record.cid,
            json: record.json,
          })),
        ),
      );
      expect(result).toHaveLength(2);
    });
  });
});
