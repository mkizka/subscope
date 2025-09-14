import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  likeFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { GeneratorRepository } from "../../../infrastructure/generator-repository.js";
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { ProfileViewBuilder } from "../actor/profile-view-builder.js";
import { ProfileViewService } from "../actor/profile-view-service.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { FeedProcessor } from "./feed-processor.js";
import { GeneratorViewService } from "./generator-view-service.js";
import { PostEmbedViewBuilder } from "./post-embed-view-builder.js";
import { PostViewService } from "./post-view-service.js";
import { ReplyRefService } from "./reply-ref-service.js";

describe("FeedProcessor", () => {
  const { testInjector, ctx } = getTestSetup();

  const feedProcessor = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("likeRepository", LikeRepository)
    .provideClass("repostRepository", RepostRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .injectClass(FeedProcessor);

  test("投稿のみの場合、FeedViewPostのリストを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .props({
        text: () => "Test post content",
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();
    const feedItem = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    const paginationResult = {
      items: [
        {
          ...feedItem,
          actorDid: asDid(feedItem.actorDid),
        },
      ],
      cursor: "2024-01-01T00:00:00.000Z",
    };

    // act
    const result = await feedProcessor.processFeedItems(paginationResult.items);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post.uri,
          cid: post.cid,
          author: {
            did: actor.did,
            handle: actor.handle,
            displayName: "Post Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
          indexedAt: expect.any(String),
        },
      },
    ]);
  });

  test("リポストの場合、reasonを含むFeedViewPostを返す", async () => {
    // arrange
    const originalAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original Author" }))
      .create();
    const reposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reposter" }))
      .create();

    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalAuthor })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .props({
        text: () => "Original post",
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();

    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => reposter })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({ record: () => repostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    const feedItem = await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .props({
        sortAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    const paginationResult = {
      items: [
        {
          ...feedItem,
          actorDid: asDid(feedItem.actorDid),
        },
      ],
      cursor: "2024-01-01T01:00:00.000Z",
    };

    // act
    const result = await feedProcessor.processFeedItems(paginationResult.items);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: originalPost.uri,
          author: {
            displayName: "Original Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
        },
        reason: {
          $type: "app.bsky.feed.defs#reasonRepost",
          by: {
            did: reposter.did,
            handle: reposter.handle,
            displayName: "Reposter",
          },
          indexedAt: "2024-01-01T01:00:00.000Z",
        },
      },
    ]);
  });

  test("リプライ投稿の場合、replyを含むFeedViewPostを返す", async () => {
    // arrange
    const rootAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root Author" }))
      .create();
    const replyAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reply Author" }))
      .create();

    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootAuthor })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .props({
        text: () => "Root post",
      })
      .create();

    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => replyAuthor })
      .create();
    const replyPost = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .props({
        text: () => "Reply post",
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();

    const feedItem = await postFeedItemFactory(ctx.db)
      .vars({ post: () => replyPost })
      .create();

    const paginationResult = {
      items: [
        {
          ...feedItem,
          actorDid: asDid(feedItem.actorDid),
        },
      ],
      cursor: undefined,
    };

    // act
    const result = await feedProcessor.processFeedItems(paginationResult.items);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: replyPost.uri,
          author: {
            displayName: "Reply Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
        },
        reply: {
          root: {
            $type: "app.bsky.feed.defs#postView",
            uri: rootPost.uri,
            author: {
              displayName: "Root Author",
            },
          },
          parent: {
            $type: "app.bsky.feed.defs#postView",
            uri: rootPost.uri,
            author: {
              displayName: "Root Author",
            },
          },
        },
      },
    ]);
  });

  test("viewerDidが渡された場合、viewerStateにlikeとrepostを含める", async () => {
    // arrange
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Viewer" }))
      .create();
    const viewerDid = asDid(viewer.did);

    const postAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Post Author" }))
      .create();

    // 投稿1（viewerがいいねとリポスト）
    const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const post1 = await postFactory(ctx.db)
      .vars({ record: () => record1 })
      .props({
        text: () => "Post with like and repost",
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();

    const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
      .vars({ actor: () => viewer })
      .create();
    await likeFactory(ctx.db)
      .vars({ record: () => likeRecord })
      .props({
        subjectUri: () => post1.uri,
        subjectCid: () => post1.cid,
      })
      .create();

    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => viewer })
      .create();
    await repostFactory(ctx.db)
      .vars({ record: () => repostRecord })
      .props({
        subjectUri: () => post1.uri,
        subjectCid: () => post1.cid,
      })
      .create();

    // 投稿2（viewerがいいねのみ）
    const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const post2 = await postFactory(ctx.db)
      .vars({ record: () => record2 })
      .props({
        text: () => "Post with like only",
        createdAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();

    const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
      .vars({ actor: () => viewer })
      .create();
    await likeFactory(ctx.db)
      .vars({ record: () => likeRecord2 })
      .props({
        subjectUri: () => post2.uri,
        subjectCid: () => post2.cid,
      })
      .create();

    // 投稿3（viewerがインタラクションなし）
    const record3 = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => postAuthor })
      .create();
    const post3 = await postFactory(ctx.db)
      .vars({ record: () => record3 })
      .props({
        text: () => "Post without interaction",
        createdAt: () => new Date("2024-01-03T00:00:00.000Z"),
      })
      .create();

    const feedItem1 = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post1 })
      .create();
    const feedItem2 = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post2 })
      .create();
    const feedItem3 = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post3 })
      .create();

    const paginationResult = {
      items: [
        { ...feedItem1, actorDid: asDid(feedItem1.actorDid) },
        { ...feedItem2, actorDid: asDid(feedItem2.actorDid) },
        { ...feedItem3, actorDid: asDid(feedItem3.actorDid) },
      ],
      cursor: undefined,
    };

    // act
    const result = await feedProcessor.processFeedItems(
      paginationResult.items,
      viewerDid,
    );

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post1.uri,
          viewer: {
            like: likeRecord.uri,
            repost: repostRecord.uri,
          },
        },
      },
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post2.uri,
          viewer: {
            like: likeRecord2.uri,
          },
        },
      },
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post3.uri,
          viewer: {},
        },
      },
    ]);
  });

  test("複数の投稿とリポストが混在する場合、正しい順序で返す", async () => {
    // arrange
    const author1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Author 1" }))
      .create();
    const author2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Author 2" }))
      .create();
    const reposter = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reposter" }))
      .create();

    // 投稿1
    const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author1 })
      .create();
    const post1 = await postFactory(ctx.db)
      .vars({ record: () => record1 })
      .props({ text: () => "Post 1" })
      .create();
    const feedItem1 = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post1 })
      .create();

    // 投稿2
    const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author2 })
      .create();
    const post2 = await postFactory(ctx.db)
      .vars({ record: () => record2 })
      .props({ text: () => "Post 2" })
      .create();

    // リポスト
    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => reposter })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({ record: () => repostRecord })
      .props({
        subjectUri: () => post2.uri,
        subjectCid: () => post2.cid,
        indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();
    const feedItem2 = await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .props({
        sortAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    const paginationResult = {
      items: [
        {
          ...feedItem1,
          actorDid: asDid(feedItem1.actorDid),
        },
        {
          ...feedItem2,
          actorDid: asDid(feedItem2.actorDid),
        },
      ],
      cursor: undefined,
    };

    // act
    const result = await feedProcessor.processFeedItems(paginationResult.items);

    // assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      post: { uri: post1.uri },
    });
    expect(result[0]).not.toHaveProperty("reason");
    expect(result[1]).toMatchObject({
      post: { uri: post2.uri },
      reason: {
        $type: "app.bsky.feed.defs#reasonRepost",
        by: { displayName: "Reposter" },
        indexedAt: "2024-01-01T02:00:00.000Z",
      },
    });
  });

  test("PostViewが見つからない場合、その項目をスキップする", async () => {
    // arrange
    const author = await actorFactory(ctx.db).create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .create();
    const feedItem = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // 投稿を削除してPostViewが見つからない状態を作る
    await ctx.db.delete(schema.posts).where(eq(schema.posts.uri, post.uri));

    const paginationResult = {
      items: [
        {
          ...feedItem,
          actorDid: asDid(feedItem.actorDid),
        },
      ],
      cursor: undefined,
    };

    // act
    const result = await feedProcessor.processFeedItems(paginationResult.items);

    // assert
    expect(result).toMatchObject([]);
  });
});
