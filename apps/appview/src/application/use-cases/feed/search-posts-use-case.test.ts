import { LoggerManager } from "@repo/common/infrastructure";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  postStatsFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { GeneratorRepository } from "../../../infrastructure/generator-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { GeneratorViewService } from "../../service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "../../service/feed/post-embed-view-builder.js";
import { PostViewService } from "../../service/feed/post-view-service.js";
import { PostSearchService } from "../../service/search/post-search-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { SearchPostsUseCase } from "./search-posts-use-case.js";

describe("SearchPostsUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const searchPostsUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("postRepository", PostRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("postViewService", PostViewService)
    .provideClass("searchService", PostSearchService)
    .injectClass(SearchPostsUseCase);

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
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "これはテスト投稿です",
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .props({ text: () => "これはテスト投稿です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const result = await searchPostsUseCase.execute({
      q: "テスト",
      limit: 10,
    });

    // assert
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts[0]).toMatchObject({
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri,
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
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "No Match User" }))
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "これは関係ない投稿です",
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .props({ text: () => "これは関係ない投稿です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => post })
      .create();

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
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit Test User" }))
      .create();

    const firstRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "最初のリミット検証投稿です",
        }),
      })
      .create();
    const firstPost = await postFactory(ctx.db)
      .vars({ record: () => firstRecord })
      .props({
        text: () => "最初のリミット検証投稿です",
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => firstPost })
      .create();

    const secondRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "二番目のリミット検証投稿です",
        }),
      })
      .create();
    const secondPost = await postFactory(ctx.db)
      .vars({ record: () => secondRecord })
      .props({
        text: () => "二番目のリミット検証投稿です",
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => secondPost })
      .create();

    // act
    const result = await searchPostsUseCase.execute({
      q: "リミット検証",
      limit: 1,
    });

    // assert
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      uri: firstPost.uri,
      record: {
        text: "最初のリミット検証投稿です",
      },
    });
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータが指定された場合、ページネーションで次のページを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Pagination Test User" }))
      .create();

    const firstRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "最初のページネーション検証投稿です",
        }),
      })
      .create();
    const firstPost = await postFactory(ctx.db)
      .vars({ record: () => firstRecord })
      .props({
        text: () => "最初のページネーション検証投稿です",
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => firstPost })
      .create();

    const secondRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "二番目のページネーション検証投稿です",
        }),
      })
      .create();
    const secondPost = await postFactory(ctx.db)
      .vars({ record: () => secondRecord })
      .props({
        text: () => "二番目のページネーション検証投稿です",
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => secondPost })
      .create();

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
    expect(firstPage.posts).toHaveLength(1);
    expect(firstPage.posts[0]).toMatchObject({
      uri: firstPost.uri,
      record: {
        text: "最初のページネーション検証投稿です",
      },
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage.posts).toHaveLength(1);
    expect(secondPage.posts[0]).toMatchObject({
      uri: secondPost.uri,
      record: {
        text: "二番目のページネーション検証投稿です",
      },
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("リプライ投稿がある場合、リプライを除外して元投稿のみを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reply Test User" }))
      .create();

    // 元投稿
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "元投稿のリプライ検証内容です",
        }),
      })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .props({ text: () => "元投稿のリプライ検証内容です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => originalPost })
      .create();

    // リプライ投稿
    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "これはリプライ検証内容のリプライです",
        }),
      })
      .create();
    const replyPost = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .props({
        text: () => "これはリプライ検証内容のリプライです",
        replyParentUri: () => originalPost.uri,
        replyParentCid: () => originalPost.cid,
        replyRootUri: () => originalPost.uri,
        replyRootCid: () => originalPost.cid,
      })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => replyPost })
      .create();

    // act
    const result = await searchPostsUseCase.execute({
      q: "リプライ検証内容",
      limit: 10,
    });

    // assert
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      uri: originalPost.uri,
      record: {
        text: "元投稿のリプライ検証内容です",
      },
    });
  });

  test("ワイルドカード文字が含まれる検索クエリの場合、文字をエスケープして検索する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Wildcard Test User" }))
      .create();

    // %を含む投稿
    const percentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "これは100%正確な情報です",
        }),
      })
      .create();
    const percentPost = await postFactory(ctx.db)
      .vars({ record: () => percentRecord })
      .props({ text: () => "これは100%正確な情報です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => percentPost })
      .create();

    // _を含む投稿
    const underscoreRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "user_nameという変数です",
        }),
      })
      .create();
    const underscorePost = await postFactory(ctx.db)
      .vars({ record: () => underscoreRecord })
      .props({ text: () => "user_nameという変数です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => underscorePost })
      .create();

    // 関係ない投稿
    const otherRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "これは関係ない投稿です",
        }),
      })
      .create();
    const otherPost = await postFactory(ctx.db)
      .vars({ record: () => otherRecord })
      .props({ text: () => "これは関係ない投稿です" })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => otherPost })
      .create();

    // act - %文字を検索
    const percentResult = await searchPostsUseCase.execute({
      q: "100%",
      limit: 10,
    });

    // act - _文字を検索
    const underscoreResult = await searchPostsUseCase.execute({
      q: "user_name",
      limit: 10,
    });

    // assert
    expect(percentResult.posts).toHaveLength(1);
    expect(percentResult.posts[0]).toMatchObject({
      uri: percentPost.uri,
      record: {
        text: "これは100%正確な情報です",
      },
    });

    expect(underscoreResult.posts).toHaveLength(1);
    expect(underscoreResult.posts[0]).toMatchObject({
      uri: underscorePost.uri,
      record: {
        text: "user_nameという変数です",
      },
    });
  });
});
