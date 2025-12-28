import { AtUri } from "@atproto/syntax";
import { generatorFactory, profileDetailedFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { GetFeedGeneratorsUseCase } from "./get-feed-generators-use-case.js";

describe("GetFeedGeneratorsUseCase", () => {
  const getFeedGeneratorsUseCase = testInjector.injectClass(
    GetFeedGeneratorsUseCase,
  );

  const generatorRepo = testInjector.resolve("generatorRepository");
  const profileRepo = testInjector.resolve("profileRepository");

  test("指定したURIのフィードジェネレーターが存在する場合、GeneratorViewを返す", async () => {
    // arrange
    const generator = generatorFactory({
      displayName: "Test Feed Generator",
      description: "A test feed generator",
    });
    generatorRepo.add(generator);

    const profile = profileDetailedFactory({
      actorDid: generator.actorDid,
      displayName: "Generator Creator",
    });
    profileRepo.add(profile);

    // act
    const result = await getFeedGeneratorsUseCase.execute([generator.uri]);

    // assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      $type: "app.bsky.feed.defs#generatorView",
      uri: generator.uri.toString(),
      cid: generator.cid,
      did: generator.did,
      displayName: "Test Feed Generator",
      description: "A test feed generator",
      creator: {
        did: generator.actorDid,
        displayName: "Generator Creator",
      },
    });
  });

  test("複数のフィードジェネレーターを指定した場合、リクエスト順に返す", async () => {
    // arrange
    const generator1 = generatorFactory({
      displayName: "First Generator",
    });
    generatorRepo.add(generator1);

    const profile1 = profileDetailedFactory({
      actorDid: generator1.actorDid,
    });
    profileRepo.add(profile1);

    const generator2 = generatorFactory({
      displayName: "Second Generator",
    });
    generatorRepo.add(generator2);

    const profile2 = profileDetailedFactory({
      actorDid: generator2.actorDid,
    });
    profileRepo.add(profile2);

    // act
    const result = await getFeedGeneratorsUseCase.execute([
      generator2.uri,
      generator1.uri,
    ]);

    // assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      displayName: "Second Generator",
    });
    expect(result[1]).toMatchObject({
      displayName: "First Generator",
    });
  });

  test("指定したURIのフィードジェネレーターが存在しない場合、空の配列を返す", async () => {
    // arrange
    const nonExistentUri = new AtUri(
      "at://did:plc:nonexistent/app.bsky.feed.generator/test",
    );

    // act
    const result = await getFeedGeneratorsUseCase.execute([nonExistentUri]);

    // assert
    expect(result).toHaveLength(0);
  });

  test("空のURI配列を渡した場合、空の配列を返す", async () => {
    // arrange & act
    const result = await getFeedGeneratorsUseCase.execute([]);

    // assert
    expect(result).toHaveLength(0);
  });

  test("一部のフィードジェネレーターのみ存在する場合、存在するもののみ返す", async () => {
    // arrange
    const generator = generatorFactory({
      displayName: "Existing Generator",
    });
    generatorRepo.add(generator);

    const profile = profileDetailedFactory({
      actorDid: generator.actorDid,
    });
    profileRepo.add(profile);

    const nonExistentUri = new AtUri(
      "at://did:plc:nonexistent/app.bsky.feed.generator/test",
    );

    // act
    const result = await getFeedGeneratorsUseCase.execute([
      generator.uri,
      nonExistentUri,
    ]);

    // assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      displayName: "Existing Generator",
    });
  });
});
