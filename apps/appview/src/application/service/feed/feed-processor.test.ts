import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
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
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../actor/profile-view-builder.js";
import { ProfileViewService } from "../actor/profile-view-service.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { FeedProcessor } from "./feed-processor.js";
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
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
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
    const result = await feedProcessor.processFeedItems(paginationResult);

    // assert
    expect(result).toMatchObject({
      feed: [
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
      ],
      cursor: "2024-01-01T00:00:00.000Z",
    });
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
    const result = await feedProcessor.processFeedItems(paginationResult);

    // assert
    expect(result).toMatchObject({
      feed: [
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
      ],
      cursor: "2024-01-01T01:00:00.000Z",
    });
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
    const result = await feedProcessor.processFeedItems(paginationResult);

    // assert
    expect(result).toMatchObject({
      feed: [
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
      ],
      cursor: undefined,
    });
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
    const result = await feedProcessor.processFeedItems(paginationResult);

    // assert
    expect(result.feed).toHaveLength(2);
    expect(result.feed[0]).toMatchObject({
      post: { uri: post1.uri },
    });
    expect(result.feed[0]).not.toHaveProperty("reason");
    expect(result.feed[1]).toMatchObject({
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
    const result = await feedProcessor.processFeedItems(paginationResult);

    // assert
    expect(result).toMatchObject({
      feed: [],
      cursor: undefined,
    });
  });
});
