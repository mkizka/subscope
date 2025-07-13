import {
  actorFactory,
  getTestSetup,
  likeFactory,
  postFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { LikeService } from "../../service/graph/like-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetLikesUseCase } from "./get-likes-use-case.js";

describe("GetLikesUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const getLikesUseCase = testInjector
    .provideClass("likeRepository", LikeRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("likeService", LikeService)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(GetLikesUseCase);

  test("投稿にいいねが付いている場合、いいねしたユーザーのプロフィールを含むレスポンスを返す", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();
    const likerActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Liker User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => likerActor })
            .create(),
        subject: () => post,
      })
      .create();

    // act
    const result = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri,
      likes: [
        {
          $type: "app.bsky.feed.getLikes#like",
          actor: {
            did: likerActor.did,
            displayName: "Liker User",
          },
        },
      ],
    });
  });

  test("投稿にいいねが付いていない場合、空のlikesを返す", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    // act
    const result = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri,
      likes: [],
    });
  });

  test("limitパラメータが指定された場合、指定した件数分のいいねを返しカーソルを含む", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();
    const likerActors = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .createList(3);

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    for (const likerActor of likerActors) {
      await likeFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.like")
              .vars({ actor: () => likerActor })
              .create(),
          subject: () => post,
        })
        .create();
    }

    // act
    const result = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 2,
    });

    // assert
    expect(result.likes).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("カーソルを指定した場合、ページネーションが動作する", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    // 複数のいいねを時系列で作成
    const firstLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "First Liker" }))
      .create();
    const secondLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Second Liker" }))
      .create();
    const thirdLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Third Liker" }))
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => firstLiker })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => secondLiker })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => thirdLiker })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    // act - 最初のページ（limit=2）
    const firstPage = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 2,
    });

    // assert - 最新の2件が返される（sortAtの降順）
    expect(firstPage).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Third Liker",
          },
        },
        {
          actor: {
            displayName: "Second Liker",
          },
        },
      ],
      cursor: expect.any(String),
    });

    // act - 次のページ
    const secondPage = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert - 残りの1件が返される
    expect(secondPage).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "First Liker",
          },
        },
      ],
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("limitパラメータが0または1の場合、指定した件数のいいねを返す", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();
    const likerActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Liker User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => likerActor })
            .create(),
        subject: () => post,
      })
      .create();

    // act - limit=0
    const zeroLimitResult = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 0,
    });

    // assert
    expect(zeroLimitResult).toMatchObject({
      likes: [],
    });

    // act - limit=1
    const oneLimitResult = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 1,
    });

    // assert
    expect(oneLimitResult).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Liker User",
          },
        },
      ],
    });
  });

  test("cidパラメータが指定された場合、レスポンスにcidを含む", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    // act
    const result = await getLikesUseCase.execute({
      uri: post.uri,
      cid: post.cid,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri,
      cid: post.cid,
      likes: [],
    });
  });

  test("複数のいいねがある場合、sortAt（createdAtとindexedAtの早い方）の降順でソートされて返す", async () => {
    // arrange
    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    // 異なる時間のいいねを作成（sortAtの順序を確認するため）
    const earlyLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Early Liker" }))
      .create();
    const latestLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Latest Liker" }))
      .create();
    const middleLiker = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Middle Liker" }))
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => earlyLiker })
            .props({
              indexedAt: () => new Date("2024-01-01T01:30:00.000Z"),
            })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => latestLiker })
            .props({
              indexedAt: () => new Date("2024-01-01T02:30:00.000Z"),
            })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => middleLiker })
            .props({
              indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
            })
            .create(),
        subject: () => post,
      })
      .props({
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // act
    const result = await getLikesUseCase.execute({
      uri: post.uri,
      limit: 50,
    });

    // assert
    // sortAtの降順：Latest(02:30) > Middle(02:00) > Early(01:00)
    expect(result).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Latest Liker",
          },
        },
        {
          actor: {
            displayName: "Middle Liker",
          },
        },
        {
          actor: {
            displayName: "Early Liker",
          },
        },
      ],
    });
  });
});
