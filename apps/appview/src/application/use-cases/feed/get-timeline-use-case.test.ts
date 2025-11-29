import { asDid } from "@atproto/did";
import { FeedItem } from "@repo/common/domain";
import { actorFactory, postFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-injector.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
import { GetTimelineUseCase } from "./get-timeline-use-case.js";

describe("GetTimelineUseCase", () => {
  const getTimelineUseCase = testInjector.injectClass(GetTimelineUseCase);

  const timelineRepo = testInjector.resolve("timelineRepository");
  const postRepo = testInjector.resolve("postRepository");
  const postStatsRepo = testInjector.resolve("postStatsRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const recordRepo = testInjector.resolve("recordRepository");

  beforeEach(() => {
    timelineRepo.clear();
    postRepo.clear();
    postStatsRepo.clear();
    profileRepo.clear();
    recordRepo.clear();
  });

  test("フォローしているユーザーがいない場合、空のタイムラインを返す", async () => {
    // arrange
    const viewer = actorFactory();

    // act
    const result = await getTimelineUseCase.execute({
      limit: 50,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
      cursor: undefined,
    });
  });

  test("フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す", async () => {
    // arrange
    const viewer = actorFactory();
    const author = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Followed User",
    });
    profileRepo.add(authorProfile);

    timelineRepo.addFollow(asDid(viewer.did), asDid(author.did));

    const { post, record } = postFactory({
      actorDid: author.did,
      text: "Hello from followed user",
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

    const feedItem = FeedItem.fromPost(post);
    timelineRepo.addFeedItem(feedItem);

    // act
    const result = await getTimelineUseCase.execute({
      limit: 50,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri.toString(),
            author: {
              did: author.did,
              displayName: "Followed User",
            },
            record: {
              text: "Hello from followed user",
            },
            likeCount: 5,
            repostCount: 2,
            replyCount: 3,
          },
        },
      ],
    });
  });

  test("自分自身の投稿もタイムラインに含まれる", async () => {
    // arrange
    const viewer = actorFactory();

    const viewerProfile = profileDetailedFactory({
      actorDid: viewer.did,
      displayName: "Viewer User",
    });
    profileRepo.add(viewerProfile);

    const { post, record } = postFactory({
      actorDid: viewer.did,
      text: "My own post",
      createdAt: new Date("2024-01-02T00:00:00Z"),
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

    const feedItem = FeedItem.fromPost(post);
    timelineRepo.addFeedItem(feedItem);

    // act
    const result = await getTimelineUseCase.execute({
      limit: 50,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri.toString(),
            author: {
              did: viewer.did,
              displayName: "Viewer User",
            },
            record: {
              text: "My own post",
            },
          },
        },
      ],
    });
  });

  test("カーソルが指定された場合、カーソル以前の投稿のみを返す", async () => {
    // arrange
    const viewer = actorFactory();
    const author = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author",
    });
    profileRepo.add(authorProfile);

    timelineRepo.addFollow(asDid(viewer.did), asDid(author.did));

    const { post: olderPost, record: olderRecord } = postFactory({
      actorDid: author.did,
      text: "Older post",
      createdAt: new Date("2024-01-01T00:00:00Z"),
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

    const olderFeedItem = FeedItem.fromPost(olderPost);
    timelineRepo.addFeedItem(olderFeedItem);

    const { post: newerPost, record: newerRecord } = postFactory({
      actorDid: author.did,
      text: "Newer post",
      createdAt: new Date("2024-01-03T00:00:00Z"),
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

    const newerFeedItem = FeedItem.fromPost(newerPost);
    timelineRepo.addFeedItem(newerFeedItem);

    // act
    const result = await getTimelineUseCase.execute({
      limit: 50,
      viewerDid: asDid(viewer.did),
      cursor: "2024-01-02T00:00:00.000Z",
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

  test("limitパラメータが0または1の場合、指定した件数の投稿を返す", async () => {
    // arrange
    const viewer = actorFactory();
    const author = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author",
    });
    profileRepo.add(authorProfile);

    timelineRepo.addFollow(asDid(viewer.did), asDid(author.did));

    const { post, record } = postFactory({
      actorDid: author.did,
      createdAt: new Date("2024-01-04T00:00:00Z"),
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

    const feedItem = FeedItem.fromPost(post);
    timelineRepo.addFeedItem(feedItem);

    // act - limit=0
    const zeroLimitResult = await getTimelineUseCase.execute({
      limit: 0,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(zeroLimitResult).toMatchObject({
      feed: [],
    });

    // act - limit=1
    const oneLimitResult = await getTimelineUseCase.execute({
      limit: 1,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(oneLimitResult.feed).toHaveLength(1);
    expect(oneLimitResult).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri.toString(),
          },
        },
      ],
    });
  });

  test("複数の投稿がある場合、新しい順に並べて返す", async () => {
    // arrange
    const viewer = actorFactory();
    const author = actorFactory();

    const authorProfile = profileDetailedFactory({
      actorDid: author.did,
      displayName: "Author",
    });
    profileRepo.add(authorProfile);

    timelineRepo.addFollow(asDid(viewer.did), asDid(author.did));

    const { post: post1, record: record1 } = postFactory({
      actorDid: author.did,
      text: "First post",
      createdAt: new Date("2024-01-05T00:00:00Z"),
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

    const feedItem1 = FeedItem.fromPost(post1);
    timelineRepo.addFeedItem(feedItem1);

    const { post: post2, record: record2 } = postFactory({
      actorDid: author.did,
      text: "Second post",
      createdAt: new Date("2024-01-06T00:00:00Z"),
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

    const feedItem2 = FeedItem.fromPost(post2);
    timelineRepo.addFeedItem(feedItem2);

    // act
    const result = await getTimelineUseCase.execute({
      limit: 50,
      viewerDid: asDid(viewer.did),
    });

    // assert
    expect(result.feed).toHaveLength(2);
    expect(result).toMatchObject({
      feed: [
        {
          post: {
            uri: post2.uri.toString(),
            record: {
              text: "Second post",
            },
          },
        },
        {
          post: {
            uri: post1.uri.toString(),
            record: {
              text: "First post",
            },
          },
        },
      ],
    });
  });
});
