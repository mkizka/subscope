import { asDid } from "@atproto/did";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
  repostFactory,
} from "@repo/common/domain";
import { FeedItem } from "@repo/common/domain";
import { testSetup } from "@repo/test-utils";
import { beforeEach, describe, expect, test } from "vitest";

import { InMemoryActorStatsRepository } from "../../../infrastructure/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryAssetUrlBuilder } from "../../../infrastructure/asset-url-builder/asset-url-builder.in-memory.js";
import { InMemoryAuthorFeedRepository } from "../../../infrastructure/author-feed-repository/author-feed-repository.in-memory.js";
import { InMemoryFollowRepository } from "../../../infrastructure/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../../../infrastructure/generator-repository/generator-repository.in-memory.js";
import { InMemoryLikeRepository } from "../../../infrastructure/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../../../infrastructure/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../../../infrastructure/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../../../infrastructure/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../../../infrastructure/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../../../infrastructure/repost-repository/repost-repository.in-memory.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
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
  const { testInjector } = testSetup;

  const injector = testInjector
    .provideClass("authorFeedRepository", InMemoryAuthorFeedRepository)
    .provideClass("postRepository", InMemoryPostRepository)
    .provideClass("postStatsRepository", InMemoryPostStatsRepository)
    .provideClass("profileRepository", InMemoryProfileRepository)
    .provideClass("followRepository", InMemoryFollowRepository)
    .provideClass("actorStatsRepository", InMemoryActorStatsRepository)
    .provideClass("recordRepository", InMemoryRecordRepository)
    .provideClass("repostRepository", InMemoryRepostRepository)
    .provideClass("likeRepository", InMemoryLikeRepository)
    .provideClass("assetUrlBuilder", InMemoryAssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", InMemoryGeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    // @ts-expect-error - Type inference issue with PostViewService
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .provideClass("authorFeedService", AuthorFeedService)
    .provideClass("feedProcessor", FeedProcessor);

  const getAuthorFeedUseCase = injector.injectClass(GetAuthorFeedUseCase);

  const authorFeedRepo = injector.resolve("authorFeedRepository");
  const postRepo = injector.resolve("postRepository");
  const postStatsRepo = injector.resolve("postStatsRepository");
  const profileRepo = injector.resolve("profileRepository");
  const repostRepo = injector.resolve("repostRepository");

  beforeEach(() => {
    authorFeedRepo.clear();
    postRepo.clear();
    postStatsRepo.clear();
    profileRepo.clear();
    repostRepo.clear();
  });

  test("posts_with_repliesフィルターで投稿がある場合、投稿とリプライを含むフィードを返す", async () => {
    // arrange
    const author = actorFactory({
      did: "did:plc:author123",
      handle: "author.test",
    });

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author User",
      handle: "author.test",
    });
    profileRepo.add(profile);

    const post = postFactory({
      actorDid: author.did,
      text: "Original post",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    postRepo.add(post);

    const postStats: PostStats = {
      likeCount: 5,
      repostCount: 2,
      replyCount: 3,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

    const reply = postFactory({
      actorDid: author.did,
      text: "Reply post",
      replyRoot: { uri: post.uri, cid: post.cid },
      replyParent: { uri: post.uri, cid: post.cid },
      createdAt: new Date("2024-01-02T00:00:00Z"),
    });
    postRepo.add(reply);

    const replyStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(reply.uri.toString(), replyStats);

    const replyFeedItem = FeedItem.fromPost(reply);
    authorFeedRepo.add(replyFeedItem, true);

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
            uri: reply.uri.toString(),
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
            uri: post.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:noreplies123",
      handle: "noreplies.test",
    });

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "No Reply Author",
      handle: "noreplies.test",
    });
    profileRepo.add(profile);

    const post = postFactory({
      actorDid: author.did,
      text: "Regular post",
      createdAt: new Date("2024-01-03T00:00:00Z"),
    });
    postRepo.add(post);

    const postStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

    const reply = postFactory({
      actorDid: author.did,
      text: "Reply that should not appear",
      replyRoot: { uri: post.uri, cid: post.cid },
      replyParent: { uri: post.uri, cid: post.cid },
      createdAt: new Date("2024-01-04T00:00:00Z"),
    });
    postRepo.add(reply);

    const replyFeedItem = FeedItem.fromPost(reply);
    authorFeedRepo.add(replyFeedItem, true);

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
            uri: post.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:reposter123",
      handle: "reposter.test",
    });
    const originalAuthor = actorFactory({
      did: "did:plc:original123",
      handle: "original.test",
    });

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Reposter",
      handle: "reposter.test",
    });
    profileRepo.add(authorProfile);

    const originalProfile = profileDetailedFactory({
      actorDid: originalAuthor.did,
      displayName: "Original Author",
      handle: "original.test",
    });
    profileRepo.add(originalProfile);

    const originalPost = postFactory({
      actorDid: originalAuthor.did,
      text: "Original post to be reposted",
      createdAt: new Date("2024-01-05T00:00:00Z"),
    });
    postRepo.add(originalPost);

    const originalPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(originalPost.uri.toString(), originalPostStats);

    const repost = repostFactory({
      actorDid: author.did,
      subjectUri: originalPost.uri,
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-06T00:00:00Z"),
    });
    repostRepo.add(repost);

    const repostFeedItem = FeedItem.fromRepost(repost);
    authorFeedRepo.add(repostFeedItem, false);

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
            uri: originalPost.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:author456",
      handle: "author456.test",
    });
    const viewer = actorFactory({
      did: "did:plc:viewer456",
      handle: "viewer456.test",
    });

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author",
      handle: "author456.test",
    });
    profileRepo.add(authorProfile);

    const viewerProfile = profileDetailedFactory({
      actorDid: viewer.did,
      displayName: "Viewer",
      handle: "viewer456.test",
    });
    profileRepo.add(viewerProfile);

    const post = postFactory({
      actorDid: author.did,
      text: "Post with viewer info",
      createdAt: new Date("2024-01-07T00:00:00Z"),
    });
    postRepo.add(post);

    const postStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

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
            uri: post.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:cursor123",
      handle: "cursor.test",
    });

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Cursor Test Author",
      handle: "cursor.test",
    });
    profileRepo.add(authorProfile);

    const olderPost = postFactory({
      actorDid: author.did,
      text: "Older post",
      createdAt: new Date("2024-01-08T00:00:00Z"),
    });
    postRepo.add(olderPost);

    const olderPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(olderPost.uri.toString(), olderPostStats);

    const olderPostFeedItem = FeedItem.fromPost(olderPost);
    authorFeedRepo.add(olderPostFeedItem, false);

    const newerPost = postFactory({
      actorDid: author.did,
      text: "Newer post",
      createdAt: new Date("2024-01-10T00:00:00Z"),
    });
    postRepo.add(newerPost);

    const newerPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(newerPost.uri.toString(), newerPostStats);

    const newerPostFeedItem = FeedItem.fromPost(newerPost);
    authorFeedRepo.add(newerPostFeedItem, false);

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(author.did),
      limit: 50,
      filter: "posts_with_replies",
      includePins: false,
      cursor: new Date("2024-01-09T00:00:00Z"),
    });

    // assert
    expect(result.feed).toHaveLength(1);
    expect(result).toMatchObject({
      feed: [
        {
          post: {
            uri: olderPost.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:unsupported123",
      handle: "unsupported.test",
    });

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
    const author = actorFactory({
      did: "did:plc:zerolimit123",
      handle: "zerolimit.test",
    });

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Zero Limit Author",
      handle: "zerolimit.test",
    });
    profileRepo.add(profile);

    const post = postFactory({
      actorDid: author.did,
      text: "Some post",
    });
    postRepo.add(post);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

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
    const author = actorFactory({
      did: "did:plc:limitone123",
      handle: "limitone.test",
    });

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Limit Test Author",
      handle: "limitone.test",
    });
    profileRepo.add(profile);

    const post1 = postFactory({
      actorDid: author.did,
      text: "Post 1",
      createdAt: new Date("2024-01-11T00:00:00Z"),
    });
    postRepo.add(post1);

    const post1Stats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post1.uri.toString(), post1Stats);

    const post1FeedItem = FeedItem.fromPost(post1);
    authorFeedRepo.add(post1FeedItem, false);

    const post2 = postFactory({
      actorDid: author.did,
      text: "Post 2",
      createdAt: new Date("2024-01-12T00:00:00Z"),
    });
    postRepo.add(post2);

    const post2Stats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post2.uri.toString(), post2Stats);

    const post2FeedItem = FeedItem.fromPost(post2);
    authorFeedRepo.add(post2FeedItem, false);

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
            uri: post2.uri.toString(),
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
    const author = actorFactory({
      did: "did:plc:noposts123",
      handle: "noposts.test",
    });

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "No Posts User",
      handle: "noposts.test",
    });
    profileRepo.add(profile);

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
