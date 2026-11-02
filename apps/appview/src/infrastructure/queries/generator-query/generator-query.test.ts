import { AtUri } from "@atproto/syntax";
import { generatorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { GeneratorQuery } from "./generator-query.js";

describe("GeneratorQuery", () => {
  const { ctx } = testSetup;

  const generatorQuery = new GeneratorQuery(ctx.db);

  describe("findByUris", () => {
    test("存在しないフィードジェネレーターは含めない", async () => {
      // act
      const result = await generatorQuery.findByUris([
        new AtUri("at://did:plc:notfound/app.bsky.feed.generator/notfound"),
      ]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在するフィードジェネレーターを返す", async () => {
      // arrange
      const generator = await generatorFactory(ctx.db).create();

      // act
      const result = await generatorQuery.findByUris([
        new AtUri(generator.uri),
      ]);

      // assert
      expect(result).toEqual([
        {
          uri: generator.uri,
          cid: generator.cid,
          actorDid: generator.actorDid,
          did: generator.did,
          displayName: generator.displayName,
          description: generator.description || null,
          avatarCid: generator.avatarCid || null,
          indexedAt: generator.indexedAt,
        },
      ]);
    });
  });
});
