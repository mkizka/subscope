import { AtUri } from "@atproto/syntax";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RecordRepository } from "./record-repository.js";

describe("RecordRepository", () => {
  const { testInjector, ctx } = testSetup;

  const recordRepository = testInjector.injectClass(RecordRepository);

  describe("findByUris", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await recordRepository.findByUris([]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在しないURIが指定された場合、空の配列を返す", async () => {
      // arrange
      const nonExistentUri = new AtUri(
        "at://did:plc:notfound/app.bsky.feed.post/notfound123",
      );

      // act
      const result = await recordRepository.findByUris([nonExistentUri]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在するURIが指定された場合、Record情報を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();

      // act
      const result = await recordRepository.findByUris([new AtUri(record.uri)]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: record.uri },
        cid: record.cid,
      });
    });

    test("複数のURIが指定された場合、それぞれのRecordを返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor1 })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor2 })
        .create();

      // act
      const result = await recordRepository.findByUris([
        new AtUri(record1.uri),
        new AtUri(record2.uri),
      ]);

      // assert
      expect(result).toHaveLength(2);
      const uris = result.map((r) => r.uri.href);
      expect(uris).toContain(record1.uri);
      expect(uris).toContain(record2.uri);
    });

    test("一部が存在しないURIの場合、存在するもののみ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();

      const nonExistentUri = new AtUri(
        "at://did:plc:notfound/app.bsky.feed.post/notfound123",
      );

      // act
      const result = await recordRepository.findByUris([
        new AtUri(record.uri),
        nonExistentUri,
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(record.uri);
    });
  });
});
