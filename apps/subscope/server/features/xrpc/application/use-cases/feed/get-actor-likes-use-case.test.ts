import { asDid } from "@atproto/did";
import {
  actorFactory,
  likeFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
import { GetActorLikesUseCase } from "./get-actor-likes-use-case.js";

describe("GetActorLikesUseCase", () => {
  const getActorLikesUseCase = testInjector.injectClass(GetActorLikesUseCase);

  const likeRepo = testInjector.resolve("likeRepository");
  const postRepo = testInjector.resolve("postRepository");
  const postStatsRepo = testInjector.resolve("postStatsRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const recordRepo = testInjector.resolve("recordRepository");

  test("actorがいいねした投稿がある場合、投稿情報を含むフィードを返す", async () => {
    // arrange
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(post);
    recordRepo.add(record);

    const postStats: PostStats = {
      likeCount: 1,
      repostCount: 2,
      replyCount: 3,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    const like = likeFactory({
      actorDid: actor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(like);

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
            uri: post.uri.toString(),
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
    const actor = actorFactory();

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
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    // 3つの投稿といいねを作成
    for (let i = 0; i < 3; i++) {
      const { post, record } = postFactory({
        actorDid: postAuthor.did,
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

      const like = likeFactory({
        actorDid: actor.did,
        subjectUri: post.uri.toString(),
        subjectCid: post.cid,
      });
      likeRepo.add(like);
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
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post: firstPost, record: firstRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(firstPost);
    recordRepo.add(firstRecord);

    const firstPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(firstPost.uri.toString(), firstPostStats);

    const { post: secondPost, record: secondRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(secondPost);
    recordRepo.add(secondRecord);

    const secondPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(secondPost.uri.toString(), secondPostStats);

    const { post: thirdPost, record: thirdRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(thirdPost);
    recordRepo.add(thirdRecord);

    const thirdPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(thirdPost.uri.toString(), thirdPostStats);

    const firstLike = likeFactory({
      actorDid: actor.did,
      subjectUri: firstPost.uri.toString(),
      subjectCid: firstPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    likeRepo.add(firstLike);

    const secondLike = likeFactory({
      actorDid: actor.did,
      subjectUri: secondPost.uri.toString(),
      subjectCid: secondPost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepo.add(secondLike);

    const thirdLike = likeFactory({
      actorDid: actor.did,
      subjectUri: thirdPost.uri.toString(),
      subjectCid: thirdPost.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T03:00:00.000Z"),
    });
    likeRepo.add(thirdLike);

    // act - 最初のページ（limit=2）
    const firstPage = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert - 最新の2件が返される（sortAtの降順）
    expect(firstPage.feed).toHaveLength(2);
    expect(firstPage.feed[0]?.post).toMatchObject({
      uri: thirdPost.uri.toString(),
    });
    expect(firstPage.feed[1]?.post).toMatchObject({
      uri: secondPost.uri.toString(),
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
      uri: firstPost.uri.toString(),
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("limitパラメータが0または1の場合、指定した件数のフィードを返す", async () => {
    // arrange
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: postAuthor.did,
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

    const like = likeFactory({
      actorDid: actor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(like);

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
      uri: post.uri.toString(),
    });
  });

  test("いいね先の投稿が削除されている場合、その投稿は結果に含まれない", async () => {
    // arrange
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post: existingPost, record: existingRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(existingPost);
    recordRepo.add(existingRecord);

    const existingPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(existingPost.uri.toString(), existingPostStats);

    // 存在しない投稿へのいいね
    const deletedLike = likeFactory({
      actorDid: actor.did,
      subjectUri: "at://deleted.actor/app.bsky.feed.post/deleted123",
      subjectCid: "bafy2bzacec123...",
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepo.add(deletedLike);

    // 存在する投稿へのいいね
    const existingLike = likeFactory({
      actorDid: actor.did,
      subjectUri: existingPost.uri.toString(),
      subjectCid: existingPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    likeRepo.add(existingLike);

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - 存在する投稿のみ返される
    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]?.post).toMatchObject({
      uri: existingPost.uri.toString(),
    });
  });

  test("viewerDidが指定された場合、viewer情報を含むフィードを返す", async () => {
    // arrange
    const actor = actorFactory();
    const viewerActor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(post);
    recordRepo.add(record);

    const postStats: PostStats = {
      likeCount: 2,
      repostCount: 1,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

    // actorのいいね
    const actorLike = likeFactory({
      actorDid: actor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(actorLike);

    // viewerのいいね
    const viewerLike = likeFactory({
      actorDid: viewerActor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(viewerLike);

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
      viewerDid: asDid(viewerActor.did),
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri.toString(),
            cid: post.cid,
            author: {
              did: postAuthor.did,
              displayName: "Post Author",
            },
            likeCount: 2,
            repostCount: 1,
            replyCount: 0,
            viewer: {
              like: viewerLike.uri.toString(),
            },
          },
        },
      ],
    });
  });

  test("複数のいいねがある場合、sortAt（createdAtとindexedAtの早い方）の降順でソートされて返す", async () => {
    // arrange
    const actor = actorFactory();
    const postAuthor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: postAuthor.did,
      displayName: "Post Author",
    });
    profileRepo.add(profile);

    const { post: earlyPost, record: earlyRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(earlyPost);
    recordRepo.add(earlyRecord);

    const earlyPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(earlyPost.uri.toString(), earlyPostStats);

    const { post: latestPost, record: latestRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(latestPost);
    recordRepo.add(latestRecord);

    const latestPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(latestPost.uri.toString(), latestPostStats);

    const { post: middlePost, record: middleRecord } = postFactory({
      actorDid: postAuthor.did,
    });
    postRepo.add(middlePost);
    recordRepo.add(middleRecord);

    const middlePostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(middlePost.uri.toString(), middlePostStats);

    const earlyLike = likeFactory({
      actorDid: actor.did,
      subjectUri: earlyPost.uri.toString(),
      subjectCid: earlyPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:30:00.000Z"),
    });
    likeRepo.add(earlyLike);

    const latestLike = likeFactory({
      actorDid: actor.did,
      subjectUri: latestPost.uri.toString(),
      subjectCid: latestPost.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:30:00.000Z"),
    });
    likeRepo.add(latestLike);

    const middleLike = likeFactory({
      actorDid: actor.did,
      subjectUri: middlePost.uri.toString(),
      subjectCid: middlePost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepo.add(middleLike);

    // act
    const result = await getActorLikesUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    // sortAtの降順：Latest(02:30) > Middle(02:00) > Early(01:00)
    expect(result.feed).toHaveLength(3);
    expect(result.feed[0]?.post).toMatchObject({
      uri: latestPost.uri.toString(),
    });
    expect(result.feed[1]?.post).toMatchObject({
      uri: middlePost.uri.toString(),
    });
    expect(result.feed[2]?.post).toMatchObject({
      uri: earlyPost.uri.toString(),
    });
  });
});
