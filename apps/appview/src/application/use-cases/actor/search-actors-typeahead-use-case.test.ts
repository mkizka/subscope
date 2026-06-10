import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("SearchActorsTypeaheadUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("クエリが空の場合、空のactors配列を返す", async () => {
    const { searchActorsTypeaheadUseCase } = services;
    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
    });
  });

  test("クエリがundefinedの場合、空のactors配列を返す", async () => {
    const { searchActorsTypeaheadUseCase } = services;
    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: undefined,
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
    });
  });

  test("クエリがスペースのみの場合、空のactors配列を返す", async () => {
    const { searchActorsTypeaheadUseCase } = services;
    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "   ",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
    });
  });

  test("表示名で検索した場合、該当するactorのProfileViewBasicを返す", async () => {
    const { searchActorsTypeaheadUseCase, profileRepository } = services;
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Unique Test User",
      handle: actor.handle ?? "unique.test",
    });
    profileRepository.add(profile);

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "Unique Test",
      limit: 10,
    });

    // assert
    expect(result.actors).toHaveLength(1);
    expect(result.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: actor.did,
      handle: profile.handle,
      displayName: "Unique Test User",
    });
  });

  test("ハンドルで検索した場合、該当するactorのProfileViewBasicを返す", async () => {
    const { searchActorsTypeaheadUseCase, profileRepository } = services;
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "User",
      handle: "searchablehandle.test",
    });
    profileRepository.add(profile);

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "searchablehandle",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: actor.did,
          handle: "searchablehandle.test",
          displayName: "User",
        },
      ],
    });
  });

  test("limit数を超えるactorが存在する場合、指定されたlimit数のactorを返す", async () => {
    const { searchActorsTypeaheadUseCase, profileRepository } = services;
    // arrange
    const uniqueId = Date.now();

    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: `UniqueLimit${uniqueId}User1`,
      indexedAt: new Date("2024-01-03T00:00:00.000Z"),
    });
    profileRepository.add(profile1);

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: `UniqueLimit${uniqueId}User2`,
      indexedAt: new Date("2024-01-02T00:00:00.000Z"),
    });
    profileRepository.add(profile2);

    const actor3 = actorFactory();
    const profile3 = profileDetailedFactory({
      actorDid: actor3.did,
      displayName: `UniqueLimit${uniqueId}User3`,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    profileRepository.add(profile3);

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: `UniqueLimit${uniqueId}`,
      limit: 2,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          displayName: `UniqueLimit${uniqueId}User1`,
        },
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          displayName: `UniqueLimit${uniqueId}User2`,
        },
      ],
    });
  });

  test("該当するactorが存在しない場合、空のactors配列を返す", async () => {
    const { searchActorsTypeaheadUseCase, profileRepository } = services;
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Test User",
    });
    profileRepository.add(profile);

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "NotFound",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
    });
  });
});
