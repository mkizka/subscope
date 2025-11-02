import {
  actorFactory,
  postFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { RepostService } from "../../service/feed/repost-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetRepostedByUseCase } from "./get-reposted-by-use-case.js";

describe("GetRepostedByUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const getRepostedByUseCase = testInjector
    .provideClass("repostRepository", RepostRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("repostService", RepostService)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(GetRepostedByUseCase);

  test("リポストがない場合、空のrepostedByを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .create();

    // act
    const result = await getRepostedByUseCase.execute({
      uri: post.uri,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri,
      repostedBy: [],
    });
  });

  test("リポストがある場合、リポストしたユーザーのプロフィールを返す", async () => {
    // arrange
    const originalActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original User" }))
      .create();
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalActor })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .create();

    const repostActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reposter" }))
      .create();
    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => repostActor })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => repostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
      })
      .create();

    // act
    const result = await getRepostedByUseCase.execute({
      uri: originalPost.uri,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri,
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: repostActor.did,
          handle: repostActor.handle,
          displayName: "Reposter",
        },
      ],
    });
  });

  test("複数のリポストがある場合、時系列の降順で返す", async () => {
    // arrange
    const originalActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original User" }))
      .create();
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalActor })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .create();

    const firstReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "First Reposter" }))
      .create();
    const firstRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => firstReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => firstRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    const secondReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Second Reposter" }))
      .create();
    const secondRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => secondReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => secondRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // act
    const result = await getRepostedByUseCase.execute({
      uri: originalPost.uri,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri,
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: secondReposter.did,
          displayName: "Second Reposter",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
  });

  test("limitパラメータによる制限が正しく動作する", async () => {
    // arrange
    const originalActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original User" }))
      .create();
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalActor })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .create();

    const firstReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "First Reposter" }))
      .create();
    const firstRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => firstReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => firstRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    const secondReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Second Reposter" }))
      .create();
    const secondRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => secondReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => secondRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    // act
    const result = await getRepostedByUseCase.execute({
      uri: originalPost.uri,
      limit: 1,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri,
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータによるページネーションが正しく動作する", async () => {
    // arrange
    const originalActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original User" }))
      .create();
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalActor })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .create();

    const firstReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "First Reposter" }))
      .create();
    const firstRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => firstReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => firstRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    const secondReposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Second Reposter" }))
      .create();
    const secondRepostRecord = await recordFactory(
      ctx.db,
      "app.bsky.feed.repost",
    )
      .vars({ actor: () => secondReposter })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => secondRepostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    // act - 最初のページ
    const firstPage = await getRepostedByUseCase.execute({
      uri: originalPost.uri,
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await getRepostedByUseCase.execute({
      uri: originalPost.uri,
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage).toMatchObject({
      uri: originalPost.uri,
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage).toMatchObject({
      uri: originalPost.uri,
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: secondReposter.did,
          displayName: "Second Reposter",
        },
      ],
    });
    expect(secondPage.cursor).toBeUndefined();
  });
});
