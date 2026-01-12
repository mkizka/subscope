import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { SearchActorsTypeaheadUseCase } from "./search-actors-typeahead-use-case.js";

describe("SearchActorsTypeaheadUseCase", () => {
  const searchActorsTypeaheadUseCase = testInjector.injectClass(
    SearchActorsTypeaheadUseCase,
  );

  const profileRepo = testInjector.resolve("profileRepository");

  test("クエリが空の場合、空のactors配列を返す", async () => {
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
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Unique Test User",
      handle: actor.handle ?? "unique.test",
    });
    profileRepo.add(profile);

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
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "User",
      handle: "searchablehandle.test",
    });
    profileRepo.add(profile);

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
    // arrange
    const uniqueId = Date.now();

    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: `UniqueLimit${uniqueId}User1`,
      indexedAt: new Date("2024-01-03T00:00:00.000Z"),
    });
    profileRepo.add(profile1);

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: `UniqueLimit${uniqueId}User2`,
      indexedAt: new Date("2024-01-02T00:00:00.000Z"),
    });
    profileRepo.add(profile2);

    const actor3 = actorFactory();
    const profile3 = profileDetailedFactory({
      actorDid: actor3.did,
      displayName: `UniqueLimit${uniqueId}User3`,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    profileRepo.add(profile3);

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
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Test User",
    });
    profileRepo.add(profile);

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
