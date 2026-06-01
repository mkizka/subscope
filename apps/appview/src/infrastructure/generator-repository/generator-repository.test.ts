import { AtUri } from "@atproto/syntax";
import { generatorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { GeneratorRepository } from "./generator-repository.js";

describe("GeneratorRepository", () => {
  const { testInjector, ctx } = testSetup;

  const generatorRepository = testInjector.injectClass(GeneratorRepository);

  describe("findByUris", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await generatorRepository.findByUris([]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在しないURIが指定された場合、空の配列を返す", async () => {
      // arrange
      const nonExistentUri = new AtUri(
        "at://did:plc:notfound/app.bsky.feed.generator/notfound123",
      );

      // act
      const result = await generatorRepository.findByUris([nonExistentUri]);

      // assert
      expect(result).toEqual([]);
    });

    test("存在するURIが指定された場合、Generator情報を返す", async () => {
      // arrange
      const generator = await generatorFactory(ctx.db).create();

      // act
      const result = await generatorRepository.findByUris([
        new AtUri(generator.uri),
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: generator.uri },
        cid: generator.cid,
        actorDid: generator.actorDid,
        did: generator.did,
        displayName: generator.displayName,
      });
    });

    test("複数のURIが指定された場合、それぞれのGeneratorを返す", async () => {
      // arrange
      const generator1 = await generatorFactory(ctx.db).create();
      const generator2 = await generatorFactory(ctx.db).create();

      // act
      const result = await generatorRepository.findByUris([
        new AtUri(generator1.uri),
        new AtUri(generator2.uri),
      ]);

      // assert
      expect(result).toHaveLength(2);
      const uris = result.map((g) => g.uri.href);
      expect(uris).toContain(generator1.uri);
      expect(uris).toContain(generator2.uri);
    });

    test("一部が存在しないURIの場合、存在するもののみ返す", async () => {
      // arrange
      const generator = await generatorFactory(ctx.db).create();

      const nonExistentUri = new AtUri(
        "at://did:plc:notfound/app.bsky.feed.generator/notfound123",
      );

      // act
      const result = await generatorRepository.findByUris([
        new AtUri(generator.uri),
        nonExistentUri,
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(generator.uri);
    });
  });
});
