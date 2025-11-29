import { asDid } from "@atproto/did";
import { FeedItem } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
  repostFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-injector.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
import { GetAuthorFeedUseCase } from "./get-author-feed-use-case.js";

describe("GetAuthorFeedUseCase", () => {
  const getAuthorFeedUseCase = testInjector.injectClass(GetAuthorFeedUseCase);

  const authorFeedRepo = testInjector.resolve("authorFeedRepository");
  const postRepo = testInjector.resolve("postRepository");
  const postStatsRepo = testInjector.resolve("postStatsRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const recordRepo = testInjector.resolve("recordRepository");
  const repostRepo = testInjector.resolve("repostRepository");

  beforeEach(() => {
    authorFeedRepo.clear();
    postRepo.clear();
    postStatsRepo.clear();
    profileRepo.clear();
    recordRepo.clear();
    repostRepo.clear();
  });

  test("posts_with_repliesフィルターで投稿がある場合、投稿とリプライを含むフィードを返す", async () => {
    // arrange
    const author = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author User",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: author.did,
      text: "Original post",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    postRepo.add(post);
    recordRepo.add(record);

    const postStats: PostStats = {
      likeCount: 5,
      repostCount: 2,
      replyCount: 3,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

    const { post: reply, record: replyRecord } = postFactory({
      actorDid: author.did,
      text: "Reply post",
      replyRoot: { uri: post.uri, cid: post.cid },
      replyParent: { uri: post.uri, cid: post.cid },
      createdAt: new Date("2024-01-02T00:00:00Z"),
    });
    postRepo.add(reply);
    recordRepo.add(replyRecord);

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
    const author = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "No Reply Author",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: author.did,
      text: "Regular post",
      createdAt: new Date("2024-01-03T00:00:00Z"),
    });
    postRepo.add(post);
    recordRepo.add(record);

    const postStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const postFeedItem = FeedItem.fromPost(post);
    authorFeedRepo.add(postFeedItem, false);

    const { post: reply, record: replyRecord } = postFactory({
      actorDid: author.did,
      replyRoot: { uri: post.uri, cid: post.cid },
      replyParent: { uri: post.uri, cid: post.cid },
      createdAt: new Date("2024-01-04T00:00:00Z"),
    });
    postRepo.add(reply);
    recordRepo.add(replyRecord);

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
    const author = actorFactory();
    const originalAuthor = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Reposter",
    });
    profileRepo.add(authorProfile);

    const originalProfile = profileDetailedFactory({
      actorDid: originalAuthor.did,
      displayName: "Original Author",
    });
    profileRepo.add(originalProfile);

    const { post: originalPost, record: originalRecord } = postFactory({
      actorDid: originalAuthor.did,
      text: "Original post to be reposted",
      createdAt: new Date("2024-01-05T00:00:00Z"),
    });
    postRepo.add(originalPost);
    recordRepo.add(originalRecord);

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
    const author = actorFactory();
    const viewer = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author",
    });
    profileRepo.add(authorProfile);

    const viewerProfile = profileDetailedFactory({
      actorDid: viewer.did,
      displayName: "Viewer",
    });
    profileRepo.add(viewerProfile);

    const { post, record } = postFactory({
      actorDid: author.did,
    });
    postRepo.add(post);
    recordRepo.add(record);

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
    const author = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Cursor Test Author",
    });
    profileRepo.add(authorProfile);

    const { post: olderPost, record: olderRecord } = postFactory({
      actorDid: author.did,
      text: "Older post",
      createdAt: new Date("2024-01-08T00:00:00Z"),
    });
    postRepo.add(olderPost);
    recordRepo.add(olderRecord);

    const olderPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(olderPost.uri.toString(), olderPostStats);

    const olderPostFeedItem = FeedItem.fromPost(olderPost);
    authorFeedRepo.add(olderPostFeedItem, false);

    const { post: newerPost, record: newerRecord } = postFactory({
      actorDid: author.did,
      createdAt: new Date("2024-01-10T00:00:00Z"),
    });
    postRepo.add(newerPost);
    recordRepo.add(newerRecord);

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
    const author = actorFactory();

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
    const author = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Zero Limit Author",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: author.did,
    });
    postRepo.add(post);
    recordRepo.add(record);

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
    const author = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Limit Test Author",
    });
    profileRepo.add(profile);

    const { post: post1, record: record1 } = postFactory({
      actorDid: author.did,
      createdAt: new Date("2024-01-11T00:00:00Z"),
    });
    postRepo.add(post1);
    recordRepo.add(record1);

    const post1Stats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post1.uri.toString(), post1Stats);

    const post1FeedItem = FeedItem.fromPost(post1);
    authorFeedRepo.add(post1FeedItem, false);

    const { post: post2, record: record2 } = postFactory({
      actorDid: author.did,
      text: "Post 2",
      createdAt: new Date("2024-01-12T00:00:00Z"),
    });
    postRepo.add(post2);
    recordRepo.add(record2);

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
    const author = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "No Posts User",
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
