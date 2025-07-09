import { LoggerManager } from "@repo/common/infrastructure";
import { required } from "@repo/common/utils";
import { actorFactory, getTestSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileViewService } from "../../service/view/profile-view-service.js";
import { SearchActorsTypeaheadUseCase } from "./search-actors-typeahead-use-case.js";

describe("SearchActorsTypeaheadUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const searchActorsTypeaheadUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(SearchActorsTypeaheadUseCase);

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
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Unique Test User" }))
      .create();

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
      handle: actor.handle,
      displayName: "Unique Test User",
    });
  });

  test("ハンドルで検索した場合、該当するactorのProfileViewBasicを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User" }))
      .create();

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: required(actor.handle),
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: actor.did,
          handle: actor.handle,
          displayName: "User",
        },
      ],
    });
  });

  test("limit数を超えるactorが存在する場合、指定されたlimit数のactorを返す", async () => {
    // arrange
    await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 1" }))
      .create();
    await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 2" }))
      .create();
    await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 3" }))
      .create();

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "Limit Test",
      limit: 2,
    });

    // assert
    expect(result.actors).toHaveLength(2);

    const displayNames = result.actors.map((actor) => actor.displayName);
    expect(displayNames).toContain("Limit Test User 1");
    expect(displayNames).toContain("Limit Test User 2");
  });

  test("該当するactorが存在しない場合、空のactors配列を返す", async () => {
    // arrange
    await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();

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
