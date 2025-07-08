import { LoggerManager } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import {
  actorFactory,
  actorStatsFactory,
  getTestSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileViewService } from "../../service/view/profile-view-service.js";
import { SearchActorsUseCase } from "./search-actors-use-case.js";

describe("SearchActorsUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const searchActorsUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("profileViewService", ProfileViewService)
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

  test("displayNameに検索クエリが含まれるアクターを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User 検索対象" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor })
      .create();

    // act
    const result = await searchActorsUseCase.execute({
      query: "検索対象",
      limit: 10,
    });

    // assert
    expect(result.actors.length).toBeGreaterThan(0);
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor.did,
          handle: actor.handle ?? "handle.invalid",
          displayName: "Test User 検索対象",
        },
      ],
    });
  });

  test("複数のアクターがある場合、検索クエリに一致するもののみを返す", async () => {
    // arrange
    const matchActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Unique Match Target" }))
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
      query: "Unique Match",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: matchActor.did,
          displayName: "Unique Match Target",
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
      .use((t) => t.withProfile({ displayName: "Pagination Test User 1" }))
      .create();
    await actorStatsFactory(ctx.db)
      .vars({ actor: () => actor1 })
      .create();

    const actor2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Pagination Test User 2" }))
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
      query: "Pagination Test",
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await searchActorsUseCase.execute({
      query: "Pagination Test",
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor2.did,
          displayName: "Pagination Test User 2",
        },
      ],
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor1.did,
          displayName: "Pagination Test User 1",
        },
      ],
      cursor: undefined,
    });
  });
});
