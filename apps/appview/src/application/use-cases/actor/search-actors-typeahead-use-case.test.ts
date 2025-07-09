import { LoggerManager } from "@repo/common/infrastructure";
import { required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
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
    const actor1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 1" }))
      .create();
    const actor2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 2" }))
      .create();
    const actor3 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 3" }))
      .create();

    // indexedAtの順序を制御（新しい順）
    await ctx.db
      .update(schema.profiles)
      .set({ indexedAt: new Date("2024-01-03T00:00:00.000Z") })
      .where(eq(schema.profiles.actorDid, actor1.did));
    await ctx.db
      .update(schema.profiles)
      .set({ indexedAt: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(schema.profiles.actorDid, actor2.did));
    await ctx.db
      .update(schema.profiles)
      .set({ indexedAt: new Date("2024-01-01T00:00:00.000Z") })
      .where(eq(schema.profiles.actorDid, actor3.did));

    // act
    const result = await searchActorsTypeaheadUseCase.execute({
      query: "Limit Test",
      limit: 2,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          displayName: "Limit Test User 1",
        },
        {
          $type: "app.bsky.actor.defs#profileViewBasic",
          displayName: "Limit Test User 2",
        },
      ],
    });
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
