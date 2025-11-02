import { LoggerManager } from "@repo/common/infrastructure";
import { required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { SearchActorsTypeaheadUseCase } from "./search-actors-typeahead-use-case.js";

describe("SearchActorsTypeaheadUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const searchActorsTypeaheadUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("profileSearchService", ProfileSearchService)
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
    const uniqueId = Date.now();
    const actor1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: `UniqueLimit${uniqueId}User1` }))
      .create();
    const actor2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: `UniqueLimit${uniqueId}User2` }))
      .create();
    const actor3 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: `UniqueLimit${uniqueId}User3` }))
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
