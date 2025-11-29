import { actorFactory, postFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-injector.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
import { SearchPostsUseCase } from "./search-posts-use-case.js";

describe("SearchPostsUseCase", () => {
  const searchPostsUseCase = testInjector.injectClass(SearchPostsUseCase);

  const postRepo = testInjector.resolve("postRepository");
  const postStatsRepo = testInjector.resolve("postStatsRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const recordRepo = testInjector.resolve("recordRepository");

  beforeEach(() => {
    postRepo.clear();
    postStatsRepo.clear();
    profileRepo.clear();
    recordRepo.clear();
  });

  test("検索クエリが空の場合、空の結果を返す", async () => {
    // act
    const result = await searchPostsUseCase.execute({
      q: "",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      posts: [],
      cursor: undefined,
    });
  });

  test("空白文字のみの検索クエリの場合、空の結果を返す", async () => {
    // act
    const result = await searchPostsUseCase.execute({
      q: "   ",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      posts: [],
      cursor: undefined,
    });
  });

  test("検索クエリに一致する投稿がある場合、該当する投稿を返す", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Test User",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: actor.did,
      text: "これはテスト投稿です",
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

    // act
    const result = await searchPostsUseCase.execute({
      q: "テスト",
      limit: 10,
    });

    // assert
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts[0]).toMatchObject({
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri.toString(),
      author: {
        did: actor.did,
        displayName: "Test User",
      },
      record: {
        $type: "app.bsky.feed.post",
        text: "これはテスト投稿です",
      },
    });
  });

  test("検索クエリに一致する投稿がない場合、空の配列を返す", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "No Match User",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: actor.did,
      text: "これは関係ない投稿です",
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

    // act
    const result = await searchPostsUseCase.execute({
      q: "存在しないキーワード",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      posts: [],
      cursor: undefined,
    });
  });

  test("limitパラメータが指定された場合、指定した件数で結果を制限する", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Limit Test User",
    });
    profileRepo.add(profile);

    const { post: firstPost, record: firstRecord } = postFactory({
      actorDid: actor.did,
      text: "最初のリミット検証投稿です",
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
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
      actorDid: actor.did,
      text: "二番目のリミット検証投稿です",
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
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

    // act
    const result = await searchPostsUseCase.execute({
      q: "リミット検証",
      limit: 1,
    });

    // assert
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      uri: firstPost.uri.toString(),
      record: {
        text: "最初のリミット検証投稿です",
      },
    });
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータが指定された場合、ページネーションで次のページを返す", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Pagination Test User",
    });
    profileRepo.add(profile);

    const { post: firstPost, record: firstRecord } = postFactory({
      actorDid: actor.did,
      text: "最初のページネーション検証投稿です",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
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
      actorDid: actor.did,
      text: "二番目のページネーション検証投稿です",
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
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

    // act - 最初のページ
    const firstPage = await searchPostsUseCase.execute({
      q: "ページネーション検証",
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await searchPostsUseCase.execute({
      q: "ページネーション検証",
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    // 降順なので、新しい投稿（二番目）が最初のページに返される
    expect(firstPage.posts).toHaveLength(1);
    expect(firstPage.posts[0]).toMatchObject({
      uri: secondPost.uri.toString(),
      record: {
        text: "二番目のページネーション検証投稿です",
      },
    });
    expect(firstPage.cursor).toBeDefined();

    // 古い投稿（最初）が次のページに返される
    expect(secondPage.posts).toHaveLength(1);
    expect(secondPage.posts[0]).toMatchObject({
      uri: firstPost.uri.toString(),
      record: {
        text: "最初のページネーション検証投稿です",
      },
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("リプライ投稿がある場合、リプライを除外して元投稿のみを返す", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Reply Test User",
    });
    profileRepo.add(profile);

    const { post: originalPost, record: originalRecord } = postFactory({
      actorDid: actor.did,
      text: "元投稿のリプライ検証内容です",
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

    const { post: replyPost, record: replyRecord } = postFactory({
      actorDid: actor.did,
      text: "これはリプライ検証内容のリプライです",
      replyParent: { uri: originalPost.uri, cid: originalPost.cid },
      replyRoot: { uri: originalPost.uri, cid: originalPost.cid },
    });
    postRepo.add(replyPost);
    recordRepo.add(replyRecord);

    const replyPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(replyPost.uri.toString(), replyPostStats);

    // act
    const result = await searchPostsUseCase.execute({
      q: "リプライ検証内容",
      limit: 10,
    });

    // assert
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      uri: originalPost.uri.toString(),
      record: {
        text: "元投稿のリプライ検証内容です",
      },
    });
  });

  test("大文字小文字を区別せずに検索する", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Case Test User",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: actor.did,
      text: "TEST投稿です",
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

    // act
    const result = await searchPostsUseCase.execute({
      q: "test",
      limit: 10,
    });

    // assert
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      uri: post.uri.toString(),
      record: {
        text: "TEST投稿です",
      },
    });
  });
});
