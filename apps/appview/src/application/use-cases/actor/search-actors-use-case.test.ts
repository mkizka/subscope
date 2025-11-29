import { LoggerManager } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { actorFactory, actorStatsFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository/profile-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { SearchActorsUseCase } from "./search-actors-use-case.js";

describe("SearchActorsUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const searchActorsUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("profileSearchService", ProfileSearchService)
    .injectClass(SearchActorsUseCase);

  test("検索クエリが空の場合、空の結果を返す", async () => {
    // act
    const result = await searchActorsUseCase.execute({
      query: "",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("空白文字のみの検索クエリの場合、空の結果を返す", async () => {
    // act
    const result = await searchActorsUseCase.execute({
      query: "   ",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("検索クエリがundefinedの場合、空の結果を返す", async () => {
    // act
    const result = await searchActorsUseCase.execute({
      query: undefined,
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("displayNameに検索クエリが含まれるアクターがある場合、そのアクターを返す", async () => {
    // arrange
    const matchActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User 検索対象" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => matchActor })
      .create();

    const noMatchActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Different Name" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => noMatchActor })
      .create();

    // act
    const result = await searchActorsUseCase.execute({
      query: "検索対象",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: matchActor.did,
          handle: matchActor.handle ?? "handle.invalid",
          displayName: "Test User 検索対象",
        },
      ],
    });
  });

  test("検索クエリに一致するアクターがない場合、空の配列を返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "No Match User" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor })
      .create();

    // act
    const result = await searchActorsUseCase.execute({
      query: "存在しないキーワード",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("limitパラメータが指定された場合、指定した件数で結果を制限する", async () => {
    // arrange
    const actor1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 1" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor1 })
      .create();

    const actor2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User 2" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor2 })
      .create();

    // act
    const result = await searchActorsUseCase.execute({
      query: "Limit Test",
      limit: 1,
    });

    // assert
    expect(result.actors.length).toBe(1);
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータが指定された場合、ページネーションで次のページを返す", async () => {
    // arrange
    const actor1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "ActorPaginationTest User 1" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor1 })
      .create();

    const actor2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "ActorPaginationTest User 2" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor2 })
      .create();

    // 最初のプロフィールのindexedAtを古い日付に更新して順序を保証
    await ctx.db
      .update(schema.profiles)
      .set({ indexedAt: new Date("2024-01-01T00:00:00.000Z") })
      .where(eq(schema.profiles.actorDid, actor1.did));
    await ctx.db
      .update(schema.profiles)
      .set({ indexedAt: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(schema.profiles.actorDid, actor2.did));

    // act - 最初のページ
    const firstPage = await searchActorsUseCase.execute({
      query: "ActorPaginationTest",
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await searchActorsUseCase.execute({
      query: "ActorPaginationTest",
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor2.did,
          displayName: "ActorPaginationTest User 2",
        },
      ],
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor1.did,
          displayName: "ActorPaginationTest User 1",
        },
      ],
      cursor: undefined,
    });
  });

  test("ワイルドカード文字が含まれる検索クエリの場合、文字をエスケープして検索する", async () => {
    // arrange
    // %を含むdisplayName
    const percentActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "100%完璧なユーザー" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => percentActor })
      .create();

    // _を含むdisplayName
    const underscoreActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "user_name_test" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => underscoreActor })
      .create();

    // 関係ないdisplayName
    const otherActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "これは関係ないユーザー" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => otherActor })
      .create();

    // act - %文字を検索
    const percentResult = await searchActorsUseCase.execute({
      query: "100%",
      limit: 10,
    });

    // act - _文字を検索
    const underscoreResult = await searchActorsUseCase.execute({
      query: "user_name",
      limit: 10,
    });

    // assert
    expect(percentResult.actors).toHaveLength(1);
    expect(percentResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: percentActor.did,
      displayName: "100%完璧なユーザー",
    });

    expect(underscoreResult.actors).toHaveLength(1);
    expect(underscoreResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: underscoreActor.did,
      displayName: "user_name_test",
    });
  });

  test("displayNameまたはhandleのいずれかに検索クエリが含まれる場合、該当するアクターを返す", async () => {
    // arrange
    const displayNameActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "テスト User" }))
      .props({ handle: () => "different.handle.com" })
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => displayNameActor })
      .create();

    const handleActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Different Name" }))
      .props({ handle: () => "testhandle.example.com" })
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => handleActor })
      .create();

    // act - displayNameで検索
    const displayNameResult = await searchActorsUseCase.execute({
      query: "テスト",
      limit: 10,
    });

    // act - handleで検索
    const handleResult = await searchActorsUseCase.execute({
      query: "testhandle",
      limit: 10,
    });

    // assert
    expect(displayNameResult.actors.length).toBe(1);
    expect(displayNameResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: displayNameActor.did,
      displayName: "テスト User",
    });

    expect(handleResult.actors.length).toBe(1);
    expect(handleResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: handleActor.did,
      handle: "testhandle.example.com",
    });
  });
});
