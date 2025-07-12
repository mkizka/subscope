import { asDid } from "@atproto/did";
import {
  actorFactory,
  getTestSetup,
  likeFactory,
  postFactory,
  postStatsFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { ActorLikesService } from "../../service/feed/actor-likes-service.js";
import { FeedProcessor } from "../../service/feed/feed-processor.js";
import { PostEmbedViewService } from "../../service/feed/post-embed-view-service.js";
import { PostViewService } from "../../service/feed/post-view-service.js";
import { ReplyRefService } from "../../service/feed/reply-ref-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetActorLikesUseCase } from "./get-actor-likes-use-case.js";

describe("GetActorLikesUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const getActorLikesUseCase = testInjector
    .provideClass("likeRepository", LikeRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postEmbedViewService", PostEmbedViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .provideClass("actorLikesService", ActorLikesService)
    .provideClass("feedProcessor", FeedProcessor)
    .injectClass(GetActorLikesUseCase);

  test("actorがいいねした投稿がある場合、投稿情報を含むフィードを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .props({
        likeCount: () => 1,
        repostCount: () => 2,
        replyCount: () => 3,
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => post,
      })
      .create();

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            cid: post.cid,
            author: {
              did: postAuthor.did,
              displayName: "Post Author",
            },
            likeCount: 1,
            repostCount: 2,
            replyCount: 3,
          },
        },
      ],
    });
  });

  test("actorがいいねした投稿がない場合、空のフィードを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
      cursor: undefined,
    });
  });

  test("limitパラメータが指定された場合、指定した件数分のフィードを返しカーソルを含む", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    // 3つの投稿といいねを作成
    const posts = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .createList(3);

    for (const post of posts) {
      await postStatsFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      await likeFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.like")
              .vars({ actor: () => actor })
              .create(),
          subject: () => post,
        })
        .create();
    }

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert
    expect(result.feed).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("カーソルを指定した場合、ページネーションが動作する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    // 異なる時刻の投稿といいねを作成
    const firstPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();
    const secondPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();
    const thirdPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => firstPost })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => secondPost })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => thirdPost })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => firstPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => secondPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => thirdPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    // act - 最初のページ（limit=2）
    const firstPage = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert - 最新の2件が返される（sortAtの降順）
    expect(firstPage.feed).toHaveLength(2);
    expect(firstPage.feed[0]?.post).toMatchObject({
      uri: thirdPost.uri,
    });
    expect(firstPage.feed[1]?.post).toMatchObject({
      uri: secondPost.uri,
    });
    expect(firstPage.cursor).toBeDefined();

    // act - 次のページ
    const secondPage = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
      cursor: firstPage.cursor ? new Date(firstPage.cursor) : undefined,
    });

    // assert - 残りの1件が返される
    expect(secondPage.feed).toHaveLength(1);
    expect(secondPage.feed[0]?.post).toMatchObject({
      uri: firstPost.uri,
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("limitパラメータが0または1の場合、指定した件数のフィードを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => post,
      })
      .create();

    // act - limit=0
    const zeroLimitResult = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 0,
    });

    // assert
    expect(zeroLimitResult).toMatchObject({
      feed: [],
    });

    // act - limit=1
    const oneLimitResult = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 1,
    });

    // assert
    expect(oneLimitResult.feed).toHaveLength(1);
    expect(oneLimitResult.feed[0]?.post).toMatchObject({
      uri: post.uri,
    });
  });

  test("いいね先の投稿が削除されている場合、その投稿は結果に含まれない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    const existingPostRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const existingPost = await postFactory(ctx.db)
      .vars({ record: () => existingPostRecord })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => existingPost })
      .create();

    // 存在しない投稿へのいいねを作成（DBに投稿レコードは作らない）
    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
      })
      .props({
        subjectUri: () => "at://deleted.actor/app.bsky.feed.post/deleted123",
        subjectCid: () => "bafy2bzacec123...",
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // 存在する投稿へのいいね
    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => existingPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - 存在する投稿のみ返される
    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]?.post).toMatchObject({
      uri: existingPost.uri,
    });
  });

  test("複数のいいねがある場合、sortAt（createdAtとindexedAtの早い方）の降順でソートされて返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    // 3つの投稿を作成
    const earlyPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();
    const latestPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();
    const middlePost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postAuthor })
            .create(),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => earlyPost })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => latestPost })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => middlePost })
      .create();

    // 異なるsortAtのいいねを作成
    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .props({
              indexedAt: () => new Date("2024-01-01T01:30:00.000Z"),
            })
            .create(),
        subject: () => earlyPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .props({
              indexedAt: () => new Date("2024-01-01T02:30:00.000Z"),
            })
            .create(),
        subject: () => latestPost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .props({
              indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
            })
            .create(),
        subject: () => middlePost,
      })
      .props({
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    // sortAtの降順：Latest(02:30) > Middle(02:00) > Early(01:00)
    expect(result.feed).toHaveLength(3);
    expect(result.feed[0]?.post).toMatchObject({
      uri: latestPost.uri,
    });
    expect(result.feed[1]?.post).toMatchObject({
      uri: middlePost.uri,
    });
    expect(result.feed[2]?.post).toMatchObject({
      uri: earlyPost.uri,
    });
  });
});
