import { AtUri } from "@atproto/syntax";
import { generatorFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetFeedGeneratorsUseCase", () => {
  let sut: TestServices["getFeedGeneratorsUseCase"];
  let generatorRepository: TestServices["generatorRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getFeedGeneratorsUseCase;
    generatorRepository = services.generatorRepository;
    profileRepository = services.profileRepository;
  });

  test("指定したURIのフィードジェネレーターが存在する場合、GeneratorViewを返す", async () => {
    // arrange
    const generator = generatorFactory({
      displayName: "Test Feed Generator",
      description: "A test feed generator",
    });
    generatorRepository.add(generator);

    const profile = profileDetailedFactory({
      actorDid: generator.actorDid,
      displayName: "Generator Creator",
    });
    profileRepository.add(profile);

    // act
    const result = await sut.execute([generator.uri]);

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
    generatorRepository.add(generator1);

    const profile1 = profileDetailedFactory({
      actorDid: generator1.actorDid,
    });
    profileRepository.add(profile1);

    const generator2 = generatorFactory({
      displayName: "Second Generator",
    });
    generatorRepository.add(generator2);

    const profile2 = profileDetailedFactory({
      actorDid: generator2.actorDid,
    });
    profileRepository.add(profile2);

    // act
    const result = await sut.execute([generator2.uri, generator1.uri]);

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
    const result = await sut.execute([nonExistentUri]);

    // assert
    expect(result).toHaveLength(0);
  });

  test("空のURI配列を渡した場合、空の配列を返す", async () => {
    // arrange & act
    const result = await sut.execute([]);

    // assert
    expect(result).toHaveLength(0);
  });

  test("一部のフィードジェネレーターのみ存在する場合、存在するもののみ返す", async () => {
    // arrange
    const generator = generatorFactory({
      displayName: "Existing Generator",
    });
    generatorRepository.add(generator);

    const profile = profileDetailedFactory({
      actorDid: generator.actorDid,
    });
    profileRepository.add(profile);

    const nonExistentUri = new AtUri(
      "at://did:plc:nonexistent/app.bsky.feed.generator/test",
    );

    // act
    const result = await sut.execute([generator.uri, nonExistentUri]);

    // assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      displayName: "Existing Generator",
    });
  });
});
