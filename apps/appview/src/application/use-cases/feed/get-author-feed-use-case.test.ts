import { asDid } from "@atproto/did";
import {
  actorFactory,
  postFactory,
  postFeedItemFactory,
  postStatsFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { AuthorFeedRepository } from "../../../infrastructure/author-feed-repository.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { GeneratorRepository } from "../../../infrastructure/generator-repository.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { AuthorFeedService } from "../../service/feed/author-feed-service.js";
import { FeedProcessor } from "../../service/feed/feed-processor.js";
import { GeneratorViewService } from "../../service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "../../service/feed/post-embed-view-builder.js";
import { PostViewService } from "../../service/feed/post-view-service.js";
import { ReplyRefService } from "../../service/feed/reply-ref-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetAuthorFeedUseCase } from "./get-author-feed-use-case.js";

describe("GetAuthorFeedUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const getAuthorFeedUseCase = testInjector
    .provideClass("authorFeedRepository", AuthorFeedRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("repostRepository", RepostRepository)
    .provideClass("likeRepository", LikeRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .provideClass("authorFeedService", AuthorFeedService)
    .provideClass("feedProcessor", FeedProcessor)
    .injectClass(GetAuthorFeedUseCase);

  test("posts_with_repliesフィルターで投稿がある場合、投稿とリプライを含むフィードを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Author User" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Original post",
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .props({
        text: () => "Original post",
        createdAt: () => new Date("2024-01-01T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .props({
        likeCount: () => 5,
        repostCount: () => 2,
        replyCount: () => 3,
      })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // リプライを作成
    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Reply post",
        }),
      })
      .create();
    const reply = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .use((t) => t.asReplyTo(post))
      .props({
        text: () => "Reply post",
        createdAt: () => new Date("2024-01-02T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => reply })
      .props({
        likeCount: () => 0,
        repostCount: () => 0,
        replyCount: () => 0,
      })
      .create();

    // リプライのfeed_itemsレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => reply })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: reply.uri,
            author: {
              did: author.did,
              displayName: "Author User",
            },
            record: {
              text: "Reply post",
            },
            likeCount: 0,
            repostCount: 0,
            replyCount: 0,
          },
        },
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              did: author.did,
              displayName: "Author User",
            },
            record: {
              text: "Original post",
            },
            likeCount: 5,
            repostCount: 2,
            replyCount: 3,
          },
        },
      ],
    });
  });

  test("posts_no_repliesフィルターの場合、リプライを除いた投稿のみを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "No Reply Author" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Regular post",
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .props({
        text: () => "Regular post",
        createdAt: () => new Date("2024-01-03T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // リプライも作成するが、フィルターで除外されることを確認
    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .create();
    const reply = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .use((t) => t.asReplyTo(post))
      .props({
        text: () => "Reply that should not appear",
        createdAt: () => new Date("2024-01-04T00:00:00Z"),
      })
      .create();

    // リプライのfeed_itemsレコードも追加（フィルターでの除外を確認するため）
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => reply })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_no_replies",
      includePins: false,
    });

    // assert
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              did: author.did,
              displayName: "No Reply Author",
            },
            record: {
              text: "Regular post",
            },
          },
        },
      ],
    });
  });

  test("リポスト投稿がある場合、reasonを含むフィードアイテムを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reposter" }))
      .create();
    const originalAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original Author" }))
      .create();

    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalAuthor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Original post to be reposted",
        }),
      })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .props({
        text: () => "Original post to be reposted",
        createdAt: () => new Date("2024-01-05T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => originalPost })
      .create();

    // オリジナル投稿のfeed_itemsレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => originalPost })
      .create();

    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => author })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () => repostRecord,
        subject: () => originalPost,
      })
      .props({
        createdAt: () => new Date("2024-01-06T00:00:00Z"),
      })
      .create();

    // リポストのfeed_itemsレコードを追加
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
    });

    // assert
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: originalPost.uri,
            author: {
              did: originalAuthor.did,
              displayName: "Original Author",
            },
            record: {
              text: "Original post to be reposted",
            },
          },
          reason: {
            $type: "app.bsky.feed.defs#reasonRepost",
            by: {
              did: author.did,
              displayName: "Reposter",
            },
          },
        },
      ],
    });
  });

  test("viewerDidが指定された場合、viewer情報が含まれる", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Author" }))
      .create();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Viewer" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .props({
        text: () => "Post with viewer info",
        createdAt: () => new Date("2024-01-07T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              did: author.did,
              displayName: "Author",
            },
          },
        },
      ],
    });
  });

  test("カーソルが指定された場合、指定日時より前の投稿のみを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Cursor Test Author" }))
      .create();

    const olderRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Older post",
        }),
      })
      .create();
    const olderPost = await postFactory(ctx.db)
      .vars({ record: () => olderRecord })
      .props({
        text: () => "Older post",
        createdAt: () => new Date("2024-01-08T00:00:00Z"),
      })
      .create();

    const newerRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Newer post",
        }),
      })
      .create();
    const newerPost = await postFactory(ctx.db)
      .vars({ record: () => newerRecord })
      .props({
        text: () => "Newer post",
        createdAt: () => new Date("2024-01-10T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => olderPost })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => newerPost })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => olderPost })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => newerPost })
      .create();

    // act - カーソルを新しい投稿の日時より少し後に設定
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
      cursor: new Date("2024-01-09T00:00:00Z"),
    });

    // assert - 古い投稿のみが返される
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          post: {
            uri: olderPost.uri,
            record: {
              text: "Older post",
            },
          },
        },
      ],
    });
  });

  test("サポートされていないフィルターの場合、空のフィードを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db).create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_media",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
      cursor: undefined,
    });
  });

  test("limitが0の場合、空のフィードを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Zero Limit Author" }))
      .create();

    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 0,
      filter: "posts_with_replies",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("limitが1の場合、1件のみ返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test Author" }))
      .create();

    const post1Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Post 1",
        }),
      })
      .create();
    const post1 = await postFactory(ctx.db)
      .vars({ record: () => post1Record })
      .props({
        text: () => "Post 1",
        createdAt: () => new Date("2024-01-11T00:00:00Z"),
      })
      .create();

    const post2Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => author })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Post 2",
        }),
      })
      .create();
    const post2 = await postFactory(ctx.db)
      .vars({ record: () => post2Record })
      .props({
        text: () => "Post 2",
        createdAt: () => new Date("2024-01-12T00:00:00Z"),
      })
      .create();

    await postStatsFactory(ctx.db)
      .vars({ post: () => post1 })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => post2 })
      .create();

    // feed_itemsテーブルにレコードを追加
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post1 })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post2 })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 1,
      filter: "posts_with_replies",
      includePins: false,
    });

    // assert
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          post: {
            uri: post2.uri,
            record: {
              text: "Post 2",
            },
          },
        },
      ],
    });
  });

  test("投稿がない場合、空のフィードを返す", async () => {
    // arrange
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "No Posts User" }))
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
      cursor: undefined,
    });
  });
});
